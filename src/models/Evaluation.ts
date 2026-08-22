import mongoose, { Schema } from 'mongoose'

export interface IEvaluation {
  _id?: string | mongoose.Types.ObjectId
  student?: string
  course?: mongoose.Types.ObjectId | string
  branch?: mongoose.Types.ObjectId | string
  syllabus?: mongoose.Types.ObjectId | string
  approvalStage?: number
  evaluationStatus?: string
  totalCredits?: number
  remainingCreditsNeeded?: number
  subjects?: Array<{
    btuSubjectCode?: string
    btuSubjectTitle?: string
    semester?: number
    equalized?: string
    equalizedSubject?: string
    mark?: number | string
    grade?: string
    credits?: number
    examBatch?: string
    examStatus?: string
    result?: string
  }>
  createdAt?: Date
  updatedAt?: Date
}

const EvaluationSchema = new Schema<IEvaluation>(
  {
    student: { type: String, index: true },
    course: { type: Schema.Types.Mixed, ref: 'Course' },
    branch: { type: Schema.Types.Mixed, ref: 'Branch' },
    syllabus: { type: Schema.Types.Mixed },
    approvalStage: { type: Number, default: 0 },
    evaluationStatus: { type: String, default: 'Pending' },
    totalCredits: { type: Number, default: 0 },
    remainingCreditsNeeded: { type: Number, default: 0 },
    subjects: [
      {
        btuSubjectCode: String,
        btuSubjectTitle: String,
        semester: Number,
        equalized: String,
        equalizedSubject: String,
        grade: String,
        mark: Schema.Types.Mixed,
        credits: Number,
        examBatch: String,
        examStatus: String,
        result: String,
      },
    ],
  },
  { timestamps: true }
)

export const Evaluation = mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', EvaluationSchema)
