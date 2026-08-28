import { connectToDatabase } from '../lib/db.js'
import { Student } from '../models/Student.js'
import { Course } from '../models/Course.js'
import { Branch } from '../models/Branch.js'
import { Evaluation } from '../models/Evaluation.js'
import { PrevUniSubjects } from '../models/PrevUniSubjects.js'
import { parseAndValidateStudentJson } from '../lib/studentParser.js'

export async function authenticateStudent(email: string, phoneInput: string) {
  await connectToDatabase()

  const cleanEmail = email.trim().toLowerCase()
  const cleanPhone = phoneInput.trim().replace(/\D/g, '')

  if (!cleanEmail || !cleanPhone) {
    return { success: false, error: 'Please enter both student email and mobile number.' }
  }

  const student = await Student.findOne({
    'personalDetails.email': cleanEmail,
  })
    .populate('course')
    .populate('branch')
    .populate('evaluation')
    .populate('prevUniSubjects')
    .lean()

  if (!student) {
    return {
      success: false,
      error: `No student record found with email '${cleanEmail}' in Bir Tikendrajit University (BTU) database.`,
    }
  }

  if (cleanPhone.length < 10) {
    return { success: false, error: 'Please enter your full mobile number (at least 10 digits).' }
  }

  const personal = student.personalDetails || {}
  const mob = String(personal.mobileNumber || '').replace(/\D/g, '')
  const wa = String(personal.whatsAppNumber || '').replace(/\D/g, '')
  const alt = String(personal.alternateContact || '').replace(/\D/g, '')
  const fMob = String(personal.fatherContactNumber || '').replace(/\D/g, '')

  // Normalise to last 10 digits to handle country code prefix variations,
  // but require input to be at least 10 digits to prevent partial guessing.
  const tail = (n: string) => n.slice(-10)
  const inputTail = tail(cleanPhone)
  const isPhoneMatch =
    (mob.length >= 10 && tail(mob) === inputTail) ||
    (wa.length >= 10 && tail(wa) === inputTail) ||
    (alt.length >= 10 && tail(alt) === inputTail) ||
    (fMob.length >= 10 && tail(fMob) === inputTail)

  if (!isPhoneMatch) {
    return { success: false, error: 'Incorrect phone number for this student account.' }
  }

  return {
    success: true,
    student: JSON.parse(JSON.stringify(student)),
  }
}

export async function importStudentsToDatabase(jsonContent: string) {
  await connectToDatabase()

  const parseResult = parseAndValidateStudentJson(jsonContent)
  if (!parseResult.isValid || parseResult.records.length === 0) {
    return {
      success: false,
      count: 0,
      error: parseResult.error || 'Invalid or empty student records in JSON.',
    }
  }

  const records = parseResult.records

  for (const rec of records) {
    const university = 'BTU'
    const courseName = rec.academicDetails?.nameOfPrograme || (typeof rec.course === 'object' && rec.course ? (rec.course as { name?: string }).name : null) || 'General Program'
    const branchName = rec.academicDetails?.branch || (typeof rec.branch === 'object' && rec.branch ? (rec.branch as { name?: string }).name : null) || 'General Branch'

    // 1. Upsert Course
    const courseDoc = await Course.findOneAndUpdate(
      { name: courseName, university },
      {
        $setOnInsert: {
          name: courseName,
          university,
          shortCode: courseName.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, ''),
        },
      },
      { upsert: true, new: true }
    )

    // 2. Upsert Branch
    const branchDoc = await Branch.findOneAndUpdate(
      { course: courseDoc._id, name: branchName },
      {
        $setOnInsert: {
          course: courseDoc._id,
          name: branchName,
          shortCode: branchName.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, ''),
        },
      },
      { upsert: true, new: true }
    )

    // 3. Upsert PrevUniSubjects if present
    let prevUniObjectId = null
    if (rec.prevUniSubjects && typeof rec.prevUniSubjects === 'object') {
      const prevData = rec.prevUniSubjects as { prevUniSubDetails?: unknown[]; markList?: unknown[] }
      const prevDoc = await PrevUniSubjects.findOneAndUpdate(
        { student: rec._id },
        {
          student: rec._id,
          prevUniSubDetails: prevData.prevUniSubDetails || [],
          markList: prevData.markList || [],
        },
        { upsert: true, new: true }
      )
      prevUniObjectId = prevDoc._id
    }

    // 4. Upsert Evaluation if present
    let evalObjectId = null
    if (rec.evaluation && typeof rec.evaluation === 'object') {
      const evalData = rec.evaluation as { approvalStage?: number; evaluationStatus?: string; subjects?: unknown[] }
      const BTU_CODE_RE = /^([A-Z]{2,6}\d{2,5}[A-Z]?)\s*-\s*(.+)$/
      const normalizedSubjects = ((evalData.subjects || []) as Record<string, unknown>[]).map(subj => {
        const s = { ...subj }
        if (!s.btuSubjectCode && s.equalizedSubject) {
          const m = String(s.equalizedSubject).match(BTU_CODE_RE)
          if (m) { s.btuSubjectCode = m[1].trim(); s.btuSubjectTitle = m[2].trim() }
          else    { s.btuSubjectTitle = s.btuSubjectTitle || String(s.equalizedSubject) }
        }
        return s
      })
      const evalDoc = await Evaluation.findOneAndUpdate(
        { student: rec._id },
        {
          student: rec._id,
          course: courseDoc._id,
          branch: branchDoc._id,
          approvalStage: evalData.approvalStage || 0,
          evaluationStatus: evalData.evaluationStatus || 'Pending',
          subjects: normalizedSubjects,
        },
        { upsert: true, new: true }
      )
      evalObjectId = evalDoc._id
    }

    // 5. Link normalized ObjectIds
    const studentData = rec as unknown as Record<string, unknown>
    studentData.university = university
    studentData.course = courseDoc._id
    studentData.branch = branchDoc._id
    if (prevUniObjectId) studentData.prevUniSubjects = prevUniObjectId
    if (evalObjectId) studentData.evaluation = evalObjectId
  }

  // 6. Bulk Upsert into Student Collection
  const bulkOperations = records.map(rec => ({
    updateOne: {
      filter: { _id: rec._id },
      update: { $set: rec },
      upsert: true,
    },
  }))

  const bulkResult = await Student.bulkWrite(bulkOperations)

  return {
    success: true,
    count: records.length,
    upsertedCount: bulkResult.upsertedCount,
    modifiedCount: bulkResult.modifiedCount,
    records: records.slice(0, 10),
  }
}

export async function fetchStudentsFromDatabase(searchQuery: string = '', limit: number = 100) {
  await connectToDatabase()

  const filter: Record<string, unknown> = {}

  if (searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'i')
    filter.$or = [
      { _id: regex },
      { enrollmentID: regex },
      { applicationID: regex },
      { 'personalDetails.name': regex },
      { 'personalDetails.email': regex },
      { 'academicDetails.nameOfPrograme': regex },
    ]
  }

  const docs = await Student.find(filter)
    .populate('course')
    .populate('branch')
    .populate('evaluation')
    .populate('prevUniSubjects')
    .limit(limit)
    .sort({ updatedAt: -1 })
    .lean()

  return { success: true, students: JSON.parse(JSON.stringify(docs)) }
}

export async function updateEvaluationSubjects(
  rows: Array<{ enrollmentID: string; btuSubjectCode: string; btuSubjectTitle: string; semester: number; credits: number }>
) {
  await connectToDatabase()
  let updated = 0
  let notFound = 0

  for (const row of rows) {
    const { enrollmentID, btuSubjectCode, btuSubjectTitle, semester, credits } = row
    if (!enrollmentID || !btuSubjectCode || !btuSubjectTitle) continue

    const student = await Student.findOne({
      $or: [{ enrollmentID }, { _id: enrollmentID }, { applicationID: enrollmentID }],
    }).lean()

    if (!student) { notFound++; continue }

    const evalDoc = await Evaluation.findOne({ student: (student as Record<string, unknown>)._id })
    if (!evalDoc) { notFound++; continue }

    const subjects = (evalDoc.subjects || []) as Record<string, unknown>[]
    let matched = false
    for (const sub of subjects) {
      const semMatch     = !semester || Number(sub.semester) === Number(semester)
      const credMatch    = !credits  || Number(sub.credits)  === Number(credits)
      const noCodeYet    = !sub.btuSubjectCode
      if (semMatch && credMatch && noCodeYet) {
        sub.btuSubjectCode  = btuSubjectCode.trim()
        sub.btuSubjectTitle = btuSubjectTitle.trim()
        matched = true
        break
      }
    }

    if (matched) {
      evalDoc.markModified('subjects')
      await evalDoc.save()
      updated++
    } else {
      notFound++
    }
  }

  return { success: true, updated, notFound }
}

export async function clearAllStudentsFromDatabase() {
  await connectToDatabase()
  const studentRes = await Student.deleteMany({})
  await Course.deleteMany({})
  await Branch.deleteMany({})
  await Evaluation.deleteMany({})
  await PrevUniSubjects.deleteMany({})

  return { success: true, deletedCount: studentRes.deletedCount }
}
