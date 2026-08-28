import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  getStudentThreads,
  getThread,
  createThread,
  sendMessage,
  updateThreadStatus,
  getAllThreads,
} from '../src/server/supportService.js'

function isAdmin(req: VercelRequest) {
  const key = req.headers['x-admin-key']
  return key && key === process.env.ADMIN_PASSWORD
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const q = req.query as Record<string, string>

      if (q.action === 'studentThreads') {
        if (!q.studentId) return res.status(400).json({ success: false, error: 'studentId required' })
        const threads = await getStudentThreads(q.studentId)
        return res.status(200).json({ success: true, threads })
      }

      if (q.action === 'thread') {
        if (!q.threadId) return res.status(400).json({ success: false, error: 'threadId required' })
        const data = await getThread(q.threadId)
        if (!data) return res.status(404).json({ success: false, error: 'Thread not found' })
        return res.status(200).json({ success: true, ...data })
      }

      if (q.action === 'allThreads') {
        if (!isAdmin(req)) return res.status(403).json({ success: false, error: 'Forbidden' })
        const result = await getAllThreads({
          status: q.status,
          page: q.page ? parseInt(q.page) : 1,
          limit: q.limit ? parseInt(q.limit) : 30,
        })
        return res.status(200).json({ success: true, ...result })
      }

      return res.status(400).json({ success: false, error: 'Unknown action' })
    }

    if (req.method === 'POST') {
      const body = req.body || {}
      const { action } = body

      if (action === 'createThread') {
        const { studentId, studentName, subject, body: msgBody, category, priority } = body
        if (!studentId || !subject || !msgBody) {
          return res.status(400).json({ success: false, error: 'studentId, subject, body required' })
        }
        const thread = await createThread({ studentId, studentName: studentName || 'Student', subject, body: msgBody, category, priority })
        return res.status(200).json({ success: true, thread })
      }

      if (action === 'sendMessage') {
        const { threadId, senderType, senderId, senderName, body: msgBody } = body
        if (!threadId || !senderType || !senderId || !msgBody) {
          return res.status(400).json({ success: false, error: 'threadId, senderType, senderId, body required' })
        }
        if (senderType === 'admin' && !isAdmin(req)) {
          return res.status(403).json({ success: false, error: 'Forbidden' })
        }
        const msg = await sendMessage({ threadId, senderType, senderId, senderName: senderName || senderType, body: msgBody })
        return res.status(200).json({ success: true, message: msg })
      }

      if (action === 'updateStatus') {
        if (!isAdmin(req)) return res.status(403).json({ success: false, error: 'Forbidden' })
        const { threadId, status, actorName } = body
        if (!threadId || !status) {
          return res.status(400).json({ success: false, error: 'threadId and status required' })
        }
        await updateThreadStatus({ threadId, status, actorName: actorName || 'Admin', actorType: 'admin' })
        return res.status(200).json({ success: true })
      }

      return res.status(400).json({ success: false, error: 'Unknown action' })
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
