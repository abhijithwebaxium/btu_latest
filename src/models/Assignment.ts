import mongoose, { Schema } from 'mongoose'

export interface IAssignment {
  _id?: mongoose.Types.ObjectId
  title: string
  course: string
  deadline: string
  submitted: number
  total: number
  status: string
  priority: string
  createdAt?: Date
  updatedAt?: Date
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    deadline: { type: String, required: true },
    submitted: { type: Number, default: 0 },
    total: { type: Number, default: 50 },
    status: { type: String, default: 'Active' },
    priority: { type: String, default: 'Medium' },
  },
  { timestamps: true }
)

export const Assignment =
  mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema)
