import { connectToDatabase } from '../lib/db'
import { Student } from '../models/Student'
import { Course } from '../models/Course'
import { Branch } from '../models/Branch'
import { Evaluation } from '../models/Evaluation'
import { PrevUniSubjects } from '../models/PrevUniSubjects'
import { parseAndValidateStudentJson } from '../lib/studentParser'

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
    return { success: false, error: 'No student record found with this email address in MongoDB.' }
  }

  const personal = student.personalDetails || {}
  const mob = String(personal.mobileNumber || '').replace(/\D/g, '')
  const wa = String(personal.whatsAppNumber || '').replace(/\D/g, '')
  const alt = String(personal.alternateContact || '').replace(/\D/g, '')
  const fMob = String(personal.fatherContactNumber || '').replace(/\D/g, '')

  const isPhoneMatch =
    (mob && (mob.endsWith(cleanPhone) || cleanPhone.endsWith(mob))) ||
    (wa && (wa.endsWith(cleanPhone) || cleanPhone.endsWith(wa))) ||
    (alt && (alt.endsWith(cleanPhone) || cleanPhone.endsWith(alt))) ||
    (fMob && (fMob.endsWith(cleanPhone) || cleanPhone.endsWith(fMob)))

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
    const university = rec.university || 'BTU'
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
    let prevUniId: string | null = null
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
      prevUniId = prevDoc._id.toString()
    }

    // 4. Upsert Evaluation if present
    let evalId: string | null = null
    if (rec.evaluation && typeof rec.evaluation === 'object') {
      const evalData = rec.evaluation as { approvalStage?: number; evaluationStatus?: string; subjects?: unknown[] }
      const evalDoc = await Evaluation.findOneAndUpdate(
        { student: rec._id },
        {
          student: rec._id,
          course: courseDoc._id,
          branch: branchDoc._id,
          approvalStage: evalData.approvalStage || 0,
          evaluationStatus: evalData.evaluationStatus || 'Pending',
          subjects: evalData.subjects || [],
        },
        { upsert: true, new: true }
      )
      evalId = evalDoc._id.toString()
    }

    // 5. Link normalized IDs
    const studentData = rec as unknown as Record<string, unknown>
    studentData.course = courseDoc._id.toString()
    studentData.branch = branchDoc._id.toString()
    if (prevUniId) studentData.prevUniSubjects = prevUniId
    if (evalId) studentData.evaluation = evalId
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
    const regex = new RegExp(searchQuery.trim(), 'i')
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

export async function clearAllStudentsFromDatabase() {
  await connectToDatabase()
  const studentRes = await Student.deleteMany({})
  await Course.deleteMany({})
  await Branch.deleteMany({})
  await Evaluation.deleteMany({})
  await PrevUniSubjects.deleteMany({})

  return { success: true, deletedCount: studentRes.deletedCount }
}
