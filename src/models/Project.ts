import mongoose, { Schema } from 'mongoose'

export interface IProject {
  _id?: mongoose.Types.ObjectId
  title: string
  lead: string
  tech: string[]
  progress: number
  status: string
  category: string
  createdAt?: Date
  updatedAt?: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    lead: { type: String, required: true, trim: true },
    tech: [{ type: String }],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, default: 'Development' },
    category: { type: String, default: 'General' },
  },
  { timestamps: true }
)

export const Project =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)
