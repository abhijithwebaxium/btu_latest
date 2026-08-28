import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema(
  {
    title:           { type: String, required: true },
    message:         { type: String, required: true },
    targetType:      { type: String, enum: ['all', 'branch', 'student'], required: true },
    targetBranch:    { type: String, default: '' },
    targetStudentId: { type: String, default: '' },
    priority:        { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    expiresAt:       { type: Date, required: true },
  },
  { timestamps: true }
)

export const Announcement =
  mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema)
