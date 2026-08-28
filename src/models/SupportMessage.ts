import mongoose, { Schema } from 'mongoose'

export type SenderType = 'student' | 'admin'

export interface ISupportMessage {
  _id: mongoose.Types.ObjectId
  threadId: mongoose.Types.ObjectId
  senderType: SenderType
  senderId: string
  senderName: string
  body: string
  createdAt?: Date
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: 'SupportThread', required: true, index: true },
    senderType: { type: String, enum: ['student', 'admin'], required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

SupportMessageSchema.index({ threadId: 1, createdAt: 1 })

export const SupportMessage =
  mongoose.models.SupportMessage ||
  mongoose.model<ISupportMessage>('SupportMessage', SupportMessageSchema)
