import mongoose, { Schema } from 'mongoose'

export interface IStudent {
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
  importedAt?: Date

  personalDetails?: {
    name?: string
    fatherName?: string
    motherName?: string
    dateOfBirth?: string
    mobileNumber?: string | number
    whatsAppNumber?: string | number
    alternateContact?: string | number
    fatherContactNumber?: string | number
    motherContactNumber?: string | number
    email?: string
    religion?: string
    category?: string
    gender?: string
    bloodGroup?: string
    nationality?: string
    district?: string
    state?: string
    country?: string
    pincode?: string | number
    idCardNumber?: string
    permanentAddress?: string
    correspondenceAddress?: string
    knownDisease?: string
    photo?: Record<string, unknown>
    idCard?: Record<string, unknown>
    signature?: Record<string, unknown>
    medicalRecord?: Record<string, unknown>
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

  course?: Schema.Types.ObjectId | string
  branch?: Schema.Types.ObjectId | string
  syllabus?: Schema.Types.ObjectId | string
  prevUniSubjects?: Schema.Types.ObjectId | string
  evaluation?: Schema.Types.ObjectId | string

  fee?: Schema.Types.Mixed
  invoices?: Array<Record<string, unknown>>
  exams?: Array<Record<string, unknown>>
  createdAt?: Date
  updatedAt?: Date
}

const StudentSchema = new Schema<IStudent>(
  {
    _id: { type: String, required: true },
    university: { type: String, default: 'BTU', index: true },
    status: { type: String, default: 'student', index: true },
    studyMode: { type: String, default: 'Credit Transfer' },
    applicationID: { type: String, index: true },
    enrollmentID: { type: String, index: true },
    enrollmentType: { type: String, default: 'Permanent' },
    admissionBatch: { type: String, index: true },
    marketingBatch: { type: String },
    programLevel: { type: Number },
    isProfileVerified: { type: Boolean, default: false },
    verificationPending: { type: Boolean, default: true },
    isFeeCompleted: { type: Boolean, default: false },
    paymentLevel: { type: String },
    importedAt: { type: Date, default: Date.now },

    personalDetails: {
      name: { type: String, required: true, trim: true, index: true },
      fatherName: { type: String, trim: true },
      motherName: { type: String, trim: true },
      dateOfBirth: { type: String },
      mobileNumber: { type: Schema.Types.Mixed },
      whatsAppNumber: { type: Schema.Types.Mixed },
      alternateContact: { type: Schema.Types.Mixed },
      fatherContactNumber: { type: Schema.Types.Mixed },
      motherContactNumber: { type: Schema.Types.Mixed },
      email: { type: String, lowercase: true, trim: true, index: true },
      religion: { type: String, trim: true },
      category: { type: String, trim: true },
      gender: { type: String, trim: true },
      bloodGroup: { type: String, trim: true },
      nationality: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      pincode: { type: Schema.Types.Mixed },
      idCardNumber: { type: String },
      permanentAddress: { type: String, trim: true },
      correspondenceAddress: { type: String, trim: true },
      knownDisease: { type: String },
      photo: { type: Schema.Types.Mixed },
      idCard: { type: Schema.Types.Mixed },
      signature: { type: Schema.Types.Mixed },
      medicalRecord: { type: Schema.Types.Mixed },
    },

    academicDetails: {
      nameOfPrograme: { type: String, trim: true, index: true },
      branch: { type: String, trim: true },
      courseCategory: { type: String, trim: true },
      courseCompletionYear: { type: String, trim: true },
      parentUniversity: { type: String, trim: true },
      periodOfStudyAtParentUniversity: { type: String, trim: true },
      lastExamAtParentUniversity: { type: String, trim: true },
      semesterCompletedAtParentUniversity: { type: Number },
      ABCUserId: { type: String },
      numberOfBacklogsAtParentUniversity: {
        theory: { type: Number, default: 0 },
        lab: { type: Number, default: 0 },
      },
      projectCompletedAtParentUniversity: {
        completed: { type: Boolean },
        nameOfProject: { type: String },
        organization: { type: String },
      },
      academicSession: { type: String },
    },

    qualificationDetails: {
      nameOfSecondaryBoard: String,
      secondaryCompletionYear: String,
      totalSecondaryMarks: Number,
      SecondaryPercentageOfMarks: Number,
      secondaryMarkList: Schema.Types.Mixed,
      nameOfSrSecondaryBoard: String,
      srSecondaryCompletionYear: String,
      totalSrSecondaryMarks: Number,
      srSecondarypercentageOfMarks: Number,
      srSecondaryMarkList: Schema.Types.Mixed,
      nameOfDiplomaBoard: String,
      diplomaCompletionYear: String,
      totalDiplomaMarks: Number,
      diplomaPercentageOfMarks: Number,
      diplomaMarkList: Schema.Types.Mixed,
      migrationCertificate: Schema.Types.Mixed,
      affidavit: Schema.Types.Mixed,
    },

    course: { type: Schema.Types.Mixed, ref: 'Course' },
    branch: { type: Schema.Types.Mixed, ref: 'Branch' },
    prevUniSubjects: { type: Schema.Types.Mixed, ref: 'PrevUniSubjects' },
    evaluation: { type: Schema.Types.Mixed, ref: 'Evaluation' },

    fee: { type: Schema.Types.Mixed },
    invoices: [{ type: Schema.Types.Mixed }],
    exams: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
)

StudentSchema.index({ enrollmentID: 1, applicationID: 1, 'personalDetails.email': 1 })

export const Student = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema)
