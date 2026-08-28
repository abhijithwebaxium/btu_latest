import { connectToDatabase } from '../lib/db.js'
import { Announcement } from '../models/Announcement.js'

export async function createAnnouncement(data: {
  title: string
  message: string
  targetType: 'all' | 'branch' | 'student'
  targetBranch?: string
  targetStudentId?: string
  priority?: 'normal' | 'high' | 'urgent'
  durationHours: number
}) {
  await connectToDatabase()
  const expiresAt = new Date(Date.now() + data.durationHours * 3_600_000)
  const doc = await Announcement.create({
    title:           data.title.trim(),
    message:         data.message.trim(),
    targetType:      data.targetType,
    targetBranch:    (data.targetBranch || '').trim(),
    targetStudentId: (data.targetStudentId || '').trim(),
    priority:        data.priority || 'normal',
    expiresAt,
  })
  return { success: true, announcement: doc.toJSON() }
}

export async function getActiveAnnouncementsForStudent(opts: {
  studentId: string
  enrollmentID?: string
  applicationID?: string
  branch?: string
}) {
  await connectToDatabase()
  const now = new Date()
  const idList = [opts.studentId, opts.enrollmentID, opts.applicationID].filter(Boolean) as string[]
  const orConditions: object[] = [{ targetType: 'all' }]
  if (opts.branch)    orConditions.push({ targetType: 'branch',  targetBranch:    opts.branch })
  if (idList.length)  orConditions.push({ targetType: 'student', targetStudentId: { $in: idList } })
  const docs = await Announcement.find({ expiresAt: { $gt: now }, $or: orConditions })
    .sort({ priority: -1, createdAt: -1 })
    .lean()
  return { success: true, announcements: JSON.parse(JSON.stringify(docs)) }
}

export async function getAllAnnouncements() {
  await connectToDatabase()
  const docs = await Announcement.find({}).sort({ createdAt: -1 }).lean()
  return { success: true, announcements: JSON.parse(JSON.stringify(docs)) }
}

export async function deleteAnnouncement(id: string) {
  await connectToDatabase()
  await Announcement.findByIdAndDelete(id)
  return { success: true }
}
