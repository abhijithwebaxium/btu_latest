import mongoose, { Schema } from 'mongoose'

export interface IBranch {
  _id?: string | mongoose.Types.ObjectId
  name: string
  shortCode: string
  course?: mongoose.Types.ObjectId | string
  status?: boolean
  subjects?: Array<{
    semester?: number
    subjectTitle?: string
    subjectCode?: string
    credit?: number
    status?: boolean
  }>
  createdAt?: Date
  updatedAt?: Date
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true },
    shortCode: { type: String, required: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    status: { type: Boolean, default: true },
    subjects: [
      {
        semester: Number,
        subjectTitle: String,
        subjectCode: String,
        credit: Number,
        status: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
)

BranchSchema.index({ course: 1, name: 1 }, { unique: true })

export const Branch = mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema)
