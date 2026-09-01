import mongoose, { Schema } from 'mongoose'

export type ThreadStatus = 'open' | 'in_progress' | 'resolution_pending' | 'resolved' | 'closed'
export type ThreadPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ThreadCategory =
  | 'general'
  | 'academic'
  | 'assignment'
  | 'project'
  | 'documents'
  | 'fee'
  | 'technical'
  | 'administration'
  | 'facility'
  | 'other'

export interface ISupportThread {
  _id: mongoose.Types.ObjectId
  studentId: string
  studentName?: string
  subject: string
  status: ThreadStatus
  priority: ThreadPriority
  category: ThreadCategory
  assignedTo?: string
  lastMessageAt?: Date
  resolutionRequestedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const SupportThreadSchema = new Schema<ISupportThread>(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String },
    subject: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolution_pending', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    category: {
      type: String,
      enum: ['general', 'academic', 'assignment', 'project', 'documents', 'fee', 'technical', 'administration', 'facility', 'other'],
      default: 'general',
    },
    assignedTo: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
    resolutionRequestedAt: { type: Date },
  },
  { timestamps: true }
)

SupportThreadSchema.index({ studentId: 1, status: 1, createdAt: -1 })
SupportThreadSchema.index({ status: 1, priority: 1, lastMessageAt: -1 })

// Force-recreate the model when the schema changes (avoids cached enum in dev)
if (mongoose.models.SupportThread) {
  delete (mongoose.models as Record<string, unknown>).SupportThread
}

export const SupportThread = mongoose.model<ISupportThread>('SupportThread', SupportThreadSchema)
