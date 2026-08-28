import mongoose, { Schema } from 'mongoose'

export type EventType =
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'category_changed'
  | 'assigned'
  | 'message_sent'
  | 'resolved'
  | 'reopened'

export interface ISupportEvent {
  _id: mongoose.Types.ObjectId
  threadId: mongoose.Types.ObjectId
  actorType: 'student' | 'admin'
  actorName: string
  eventType: EventType
  oldValue?: string
  newValue?: string
  createdAt?: Date
}

const SupportEventSchema = new Schema<ISupportEvent>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: 'SupportThread', required: true, index: true },
    actorType: { type: String, enum: ['student', 'admin'], required: true },
    actorName: { type: String, required: true },
    eventType: {
      type: String,
      enum: ['created', 'status_changed', 'priority_changed', 'category_changed', 'assigned', 'message_sent', 'resolved', 'reopened'],
      required: true,
    },
    oldValue: { type: String },
    newValue: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

SupportEventSchema.index({ threadId: 1, createdAt: 1 })

export const SupportEvent =
  mongoose.models.SupportEvent ||
  mongoose.model<ISupportEvent>('SupportEvent', SupportEventSchema)
