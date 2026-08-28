import mongoose, { Schema } from 'mongoose'

export type NotificationKind =
  | 'ticket_opened'
  | 'ticket_replied'
  | 'ticket_status_changed'
  | 'ticket_resolved'
  | 'system'
  | 'announcement'

export type RecipientType = 'STUDENT' | 'ADMIN'

export interface INotification {
  _id: string
  studentId?: string
  recipientType: RecipientType
  kind: NotificationKind
  title: string
  body: string
  link?: string
  isRead: boolean
  isDeleted: boolean
  readAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    studentId: { type: String, index: true },
    recipientType: { type: String, enum: ['STUDENT', 'ADMIN'], required: true, index: true },
    kind: {
      type: String,
      enum: ['ticket_opened', 'ticket_replied', 'ticket_status_changed', 'ticket_resolved', 'system', 'announcement'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
)

NotificationSchema.index({ studentId: 1, isDeleted: 1, createdAt: -1 })
NotificationSchema.index({ recipientType: 1, isDeleted: 1, createdAt: -1 })

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema)
