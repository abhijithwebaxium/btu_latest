export interface StudentRecord {
  _id: string
  university?: string
  status?: string
  studyMode?: string
  applicationID?: string
  enrollmentID?: string
  enrollmentType?: string
  admissionBatch?: string
  marketingBatch?: string
  programLevel?: number
  isProfileVerified?: boolean
  verificationPending?: boolean
  isFeeCompleted?: boolean
  paymentLevel?: string
  createdAt?: string
  updatedAt?: string

  personalDetails?: {
    name?: string
    fatherName?: string
    motherName?: string
    dateOfBirth?: string
    mobileNumber?: number | string
    whatsAppNumber?: number | string
    alternateContact?: number | string
    fatherContactNumber?: number | string
    motherContactNumber?: number | string
    email?: string
    religion?: string
    category?: string
    gender?: string
    bloodGroup?: string
    nationality?: string
    district?: string
    state?: string
    country?: string
    pincode?: number | string
    idCardNumber?: string
    permanentAddress?: string
    correspondenceAddress?: string
    knownDisease?: string
    photo?: { url?: string; isSubmitted?: boolean }
    idCard?: { url?: string; isSubmitted?: boolean }
    signature?: { url?: string; isSubmitted?: boolean }
    medicalRecord?: { url?: string; isSubmitted?: boolean }
  }

  academicDetails?: {
    nameOfPrograme?: string
    branch?: string
    courseCategory?: string
    courseCompletionYear?: string
    parentUniversity?: string
    periodOfStudyAtParentUniversity?: string
    lastExamAtParentUniversity?: string
    semesterCompletedAtParentUniversity?: number
    ABCUserId?: string
    numberOfBacklogsAtParentUniversity?: {
      theory?: number
      lab?: number
    }
    projectCompletedAtParentUniversity?: {
      completed?: boolean
      nameOfProject?: string
      organization?: string
    }
    academicSession?: string
  }

  qualificationDetails?: Record<string, unknown>
  course?: Record<string, unknown> | string
  branch?: Record<string, unknown> | string
  syllabus?: Record<string, unknown> | string
  prevUniSubjects?: Record<string, unknown>
  evaluation?: Record<string, unknown>
  fee?: Record<string, unknown>
  invoices?: Array<Record<string, unknown>>
  exams?: Array<Record<string, unknown>>
  importedAt?: string
}

export interface ValidationResult {
  isValid: boolean
  records: StudentRecord[]
  error?: string
}

/**
 * Validates and parses raw JSON input string or parsed object into typed StudentRecord[]
 */
export function parseAndValidateStudentJson(rawContent: string | unknown): ValidationResult {
  try {
    let data: unknown = rawContent
    if (typeof rawContent === 'string') {
      data = JSON.parse(rawContent)
    }

    if (!data) {
      return { isValid: false, records: [], error: 'Empty JSON content' }
    }

    const rawRecords: unknown[] = Array.isArray(data) ? data : [data]
    const validRecords: StudentRecord[] = []

    for (let i = 0; i < rawRecords.length; i++) {
      const item = rawRecords[i] as Record<string, unknown>

      if (typeof item !== 'object' || item === null) {
        continue
      }

      const hasPersonalDetails = item.personalDetails && typeof item.personalDetails === 'object'
      const hasStudentId = item._id || item.enrollmentID || item.applicationID

      if (!hasPersonalDetails && !hasStudentId) {
        continue
      }

      const rec = item as unknown as StudentRecord

      if (!rec._id) {
        rec._id = rec.enrollmentID || rec.applicationID || ('STU_' + crypto.randomUUID())
      }

      rec.importedAt = new Date().toISOString()
      validRecords.push(rec)
    }

    if (validRecords.length === 0) {
      return {
        isValid: false,
        records: [],
        error: 'No valid student records found in JSON file. Expected a BTU student export structure.',
      }
    }

    return {
      isValid: true,
      records: validRecords,
    }
  } catch (err) {
    return {
      isValid: false,
      records: [],
      error: `JSON Syntax Error: ${(err as Error).message}`,
    }
  }
}
