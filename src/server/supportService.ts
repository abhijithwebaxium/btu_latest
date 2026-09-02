import { connectToDatabase } from '../lib/db.js'
import { SupportThread } from '../models/SupportThread.js'
import { SupportMessage } from '../models/SupportMessage.js'
import { SupportEvent } from '../models/SupportEvent.js'
import { createNotification } from './notificationService.js'
import type { ThreadCategory, ThreadPriority, ThreadStatus } from '../models/SupportThread.js'

export async function getStudentThreads(studentId: string) {
  await connectToDatabase()
  return SupportThread.find({ studentId }).sort({ lastMessageAt: -1 }).lean()
}

export async function getThread(threadId: string) {
  await connectToDatabase()
  const thread = await SupportThread.findById(threadId).lean()
  if (!thread) return null
  const messages = await SupportMessage.find({ threadId }).sort({ createdAt: 1 }).lean()
  const events = await SupportEvent.find({ threadId }).sort({ createdAt: 1 }).lean()
  return { thread, messages, events }
}

export async function createThread(data: {
  studentId: string
  studentName: string
  subject: string
  body: string
  category?: ThreadCategory
  priority?: ThreadPriority
}) {
  await connectToDatabase()

  const thread = await SupportThread.create({
    studentId: data.studentId,
    studentName: data.studentName,
    subject: data.subject,
    category: data.category || 'general',
    priority: data.priority || 'normal',
    status: 'open',
    lastMessageAt: new Date(),
  })

  await SupportMessage.create({
    threadId: thread._id,
    senderType: 'student',
    senderId: data.studentId,
    senderName: data.studentName,
    body: data.body,
  })

  await SupportEvent.create({
    threadId: thread._id,
    actorType: 'student',
    actorName: data.studentName,
    eventType: 'created',
    newValue: data.subject,
  })

  await createNotification({
    recipientType: 'ADMIN',
    kind: 'ticket_opened',
    title: `New Ticket: ${data.subject}`,
    body: `${data.studentName} opened a support ticket.`,
    link: `/tickets/${thread._id}`,
  })

  return thread
}

export async function sendMessage(data: {
  threadId: string
  senderType: 'student' | 'admin'
  senderId: string
  senderName: string
  body: string
}) {
  await connectToDatabase()
  const thread = await SupportThread.findById(data.threadId)
  if (!thread) throw new Error('Thread not found')

  const msg = await SupportMessage.create({
    threadId: data.threadId,
    senderType: data.senderType,
    senderId: data.senderId,
    senderName: data.senderName,
    body: data.body,
  })

  const newStatus: ThreadStatus =
    data.senderType === 'admin'
      ? 'in_progress'
      : thread.status === 'resolved'
      ? 'open'
      : thread.status

  await SupportThread.findByIdAndUpdate(data.threadId, {
    status: newStatus,
    lastMessageAt: new Date(),
  })

  await SupportEvent.create({
    threadId: data.threadId,
    actorType: data.senderType,
    actorName: data.senderName,
    eventType: 'message_sent',
  })

  if (data.senderType === 'admin') {
    await createNotification({
      studentId: thread.studentId,
      recipientType: 'STUDENT',
      kind: 'ticket_replied',
      title: `Reply on: ${thread.subject}`,
      body: `${data.senderName} replied to your support ticket.`,
      link: `/my-tickets/${data.threadId}`,
    })
  } else {
    await createNotification({
      recipientType: 'ADMIN',
      kind: 'ticket_replied',
      title: `Student replied: ${thread.subject}`,
      body: `${data.senderName} sent a new message.`,
      link: `/tickets/${data.threadId}`,
    })
  }

  return msg
}

export async function updateThreadStatus(data: {
  threadId: string
  status: ThreadStatus
  actorName: string
  actorType: 'student' | 'admin'
}) {
  await connectToDatabase()
  const thread = await SupportThread.findById(data.threadId)
  if (!thread) throw new Error('Thread not found')

  const oldStatus = thread.status
  const updates: Record<string, unknown> = { status: data.status }
  if (data.status === 'resolution_pending') updates.resolutionRequestedAt = new Date()

  await SupportThread.findByIdAndUpdate(data.threadId, updates)

  await SupportEvent.create({
    threadId: data.threadId,
    actorType: data.actorType,
    actorName: data.actorName,
    eventType: 'status_changed',
    oldValue: oldStatus,
    newValue: data.status,
  })

  if (data.actorType === 'admin' && thread.studentId) {
    const isResolved = data.status === 'resolved'
    await createNotification({
      studentId: thread.studentId,
      recipientType: 'STUDENT',
      kind: isResolved ? 'ticket_resolved' : 'ticket_status_changed',
      title: isResolved ? `Ticket Resolved: ${thread.subject}` : `Ticket Updated: ${thread.subject}`,
      body: isResolved
        ? 'Your support ticket has been marked as resolved.'
        : `Status changed from ${oldStatus} to ${data.status}.`,
      link: `/my-tickets/${data.threadId}`,
    })
  }
}

export async function getAllThreads(opts: { status?: string; category?: string; page?: number; limit?: number }) {
  await connectToDatabase()
  const { status, category, page = 1, limit = 30 } = opts
  const query: Record<string, unknown> = {}
  if (status && status !== 'all') query.status = status
  if (category && category !== 'all') {
    if (category === 'support') {
      query.category = { $nin: ['assignment', 'project'] }
    } else {
      query.category = category
    }
  }

  const total = await SupportThread.countDocuments(query)
  const threads = await SupportThread.find(query)
    .sort({ lastMessageAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  return { threads, total, page, totalPages: Math.ceil(total / limit) }
}
