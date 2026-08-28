import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  softDeleteNotification,
  clearAllNotifications,
  createNotification,
} from '../src/server/notificationService.js'
import type { RecipientType } from '../src/models/Notification.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const q = req.query as Record<string, string>
      const recipientType = (q.recipientType || 'STUDENT') as RecipientType

      if (q.action === 'unreadCount') {
        const count = await getUnreadCount({ studentId: q.studentId, recipientType })
        return res.status(200).json({ success: true, count })
      }

      const result = await listNotifications({
        studentId: q.studentId,
        recipientType,
        filter: (q.filter as 'all' | 'unread' | 'read') || 'all',
        page: q.page ? parseInt(q.page) : 1,
        limit: q.limit ? parseInt(q.limit) : 20,
      })
      return res.status(200).json({ success: true, ...result })
    }

    if (req.method === 'POST') {
      const body = req.body || {}
      const { action } = body
      const recipientType = (body.recipientType || 'STUDENT') as RecipientType

      if (action === 'markRead') {
        await markAsRead(body.id)
        return res.status(200).json({ success: true })
      }
      if (action === 'markAllRead') {
        await markAllAsRead({ studentId: body.studentId, recipientType })
        return res.status(200).json({ success: true })
      }
      if (action === 'delete') {
        await softDeleteNotification(body.id)
        return res.status(200).json({ success: true })
      }
      if (action === 'clearAll') {
        await clearAllNotifications({ studentId: body.studentId, recipientType })
        return res.status(200).json({ success: true })
      }
      if (action === 'create') {
        const n = await createNotification(body.data)
        return res.status(200).json({ success: true, notification: n })
      }

      return res.status(400).json({ success: false, error: 'Unknown action' })
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
