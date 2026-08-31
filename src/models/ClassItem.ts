import mongoose, { Schema } from 'mongoose'

export interface IClassItem {
  _id?: mongoose.Types.ObjectId
  title: string
  code: string
  instructor: string
  time: string
  room: string
  status: string
  students: number
  createdAt?: Date
  updatedAt?: Date
}

const ClassItemSchema = new Schema<IClassItem>(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    time: { type: String, default: 'TBD' },
    room: { type: String, default: 'TBD' },
    status: { type: String, default: 'Upcoming' },
    students: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const ClassItem =
  mongoose.models.ClassItem || mongoose.model<IClassItem>('ClassItem', ClassItemSchema)
