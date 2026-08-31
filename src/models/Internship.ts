import mongoose, { Schema } from 'mongoose'

export interface IInternship {
  _id?: mongoose.Types.ObjectId
  company: string
  role: string
  location: string
  stipend: string
  applicants: number
  status: string
  logo: string
  createdAt?: Date
  updatedAt?: Date
}

const InternshipSchema = new Schema<IInternship>(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, default: 'Remote' },
    stipend: { type: String, default: 'N/A' },
    applicants: { type: Number, default: 0 },
    status: { type: String, default: 'Open' },
    logo: { type: String, default: '🏢' },
  },
  { timestamps: true }
)

export const Internship =
  mongoose.models.Internship || mongoose.model<IInternship>('Internship', InternshipSchema)
