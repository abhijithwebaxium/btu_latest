import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  createAnnouncement,
  getAllAnnouncements,
  getActiveAnnouncementsForStudent,
  deleteAnnouncement,
} from '../src/server/announcementService.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const adminKey = process.env.ADMIN_PASSWORD
  const isAdmin = adminKey && req.headers['x-admin-key'] === adminKey

  try {
    if (req.method === 'GET') {
      const q = req.query as Record<string, string>
      if (q.mode === 'admin') {
        if (!isAdmin) return res.status(403).json({ success: false, error: 'Forbidden' })
        return res.status(200).json(await getAllAnnouncements())
      }
      return res.status(200).json(
        await getActiveAnnouncementsForStudent({
          studentId:     q.studentId     || '',
          enrollmentID:  q.enrollmentID,
          applicationID: q.applicationID,
          branch:        q.branch,
        })
      )
    }

    if (req.method === 'POST') {
      if (!isAdmin) return res.status(403).json({ success: false, error: 'Forbidden' })
      return res.status(201).json(await createAnnouncement(req.body || {}))
    }

    if (req.method === 'DELETE') {
      if (!isAdmin) return res.status(403).json({ success: false, error: 'Forbidden' })
      const { id } = req.query as Record<string, string>
      if (!id) return res.status(400).json({ success: false, error: 'id required' })
      return res.status(200).json(await deleteAnnouncement(id))
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message })
  }
}
