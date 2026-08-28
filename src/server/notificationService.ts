import { connectToDatabase } from '../lib/db.js'
import { Notification } from '../models/Notification.js'
import type { NotificationKind, RecipientType } from '../models/Notification.js'

export async function createNotification(data: {
  studentId?: string
  recipientType: RecipientType
  kind: NotificationKind
  title: string
  body: string
  link?: string
}) {
  await connectToDatabase()
  return Notification.create(data)
}

export async function listNotifications(opts: {
  studentId?: string
  recipientType: RecipientType
  filter?: 'all' | 'unread' | 'read'
  page?: number
  limit?: number
}) {
  await connectToDatabase()
  const { studentId, recipientType, filter = 'all', page = 1, limit = 20 } = opts

  const query: Record<string, unknown> = { isDeleted: false, recipientType }
  if (studentId) query.studentId = studentId
  if (filter === 'unread') query.isRead = false
  if (filter === 'read') query.isRead = true

  const total = await Notification.countDocuments(query)
  const items = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  return { items, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getUnreadCount(opts: { studentId?: string; recipientType: RecipientType }) {
  await connectToDatabase()
  const query: Record<string, unknown> = { recipientType: opts.recipientType, isRead: false, isDeleted: false }
  if (opts.studentId) query.studentId = opts.studentId
  return Notification.countDocuments(query)
}

export async function markAsRead(id: string) {
  await connectToDatabase()
  return Notification.findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true })
}

export async function markAllAsRead(opts: { studentId?: string; recipientType: RecipientType }) {
  await connectToDatabase()
  const query: Record<string, unknown> = { recipientType: opts.recipientType, isRead: false, isDeleted: false }
  if (opts.studentId) query.studentId = opts.studentId
  return Notification.updateMany(query, { isRead: true, readAt: new Date() })
}

export async function softDeleteNotification(id: string) {
  await connectToDatabase()
  return Notification.findByIdAndUpdate(id, { isDeleted: true })
}

export async function clearAllNotifications(opts: { studentId?: string; recipientType: RecipientType }) {
  await connectToDatabase()
  const query: Record<string, unknown> = { recipientType: opts.recipientType }
  if (opts.studentId) query.studentId = opts.studentId
  return Notification.updateMany(query, { isDeleted: true })
}
