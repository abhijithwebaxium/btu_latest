import mongoose, { Schema } from 'mongoose'

export interface ICourse {
  _id?: string | mongoose.Types.ObjectId
  name: string
  university: string
  shortCode: string
  numberOfSemesters?: number
  semestersRequired?: number
  status?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, trim: true },
    university: { type: String, required: true, trim: true },
    shortCode: { type: String, required: true, trim: true },
    numberOfSemesters: { type: Number, default: 8 },
    semestersRequired: { type: Number, default: 4 },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
)

CourseSchema.index({ name: 1, university: 1 }, { unique: true })

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema)
