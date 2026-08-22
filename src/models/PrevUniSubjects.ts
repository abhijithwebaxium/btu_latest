import mongoose, { Schema } from 'mongoose'

export interface IPrevUniSubjects {
  student?: string | Schema.Types.ObjectId
  prevUniSubDetails?: Array<{
    subjectTitle?: string
    subjectCode?: string
    credits?: number
    grade?: string
    mark?: number
    result?: string
    semester?: number
  }>
  markList?: Array<{
    semester?: number
    name?: string[]
    isSubmitted?: boolean
  }>
  createdAt?: Date
  updatedAt?: Date
}

const PrevUniSubjectsSchema = new Schema<IPrevUniSubjects>(
  {
    student: { type: Schema.Types.Mixed, index: true },
    prevUniSubDetails: [
      {
        subjectTitle: String,
        subjectCode: String,
        credits: Number,
        grade: String,
        mark: Schema.Types.Mixed,
        result: String,
        semester: Number,
      },
    ],
    markList: [
      {
        semester: Number,
        name: [String],
        isSubmitted: Boolean,
      },
    ],
  },
  { timestamps: true }
)

export const PrevUniSubjects =
  mongoose.models.PrevUniSubjects || mongoose.model<IPrevUniSubjects>('PrevUniSubjects', PrevUniSubjectsSchema)
