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
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    syllabus: { type: Schema.Types.ObjectId },
    approvalStage: { type: Number, default: 0 },
    evaluationStatus: { type: String, default: 'Pending' },
    totalCredits: { type: Number, default: 0 },
    remainingCreditsNeeded: { type: Number, default: 0 },
    subjects: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const Evaluation = mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', EvaluationSchema)
