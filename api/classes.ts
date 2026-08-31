import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectToDatabase } from '../src/lib/db.js'
import { ClassItem } from '../src/models/ClassItem.js'

function isAdmin(req: VercelRequest) {
  return req.headers['x-admin-key'] === process.env.ADMIN_PASSWORD
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    await connectToDatabase()

    if (req.method === 'GET') {
      const classes = await ClassItem.find().sort({ createdAt: -1 }).lean()
      return res.status(200).json({ success: true, classes })
    }

    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    if (req.method === 'POST') {
      const { title, code, instructor, time, room, status, students } = req.body || {}
      if (!title || !code || !instructor) {
        return res.status(400).json({ success: false, error: 'title, code, instructor required' })
      }
      const classItem = await ClassItem.create({
        title,
        code,
        instructor,
        time: time || 'TBD',
        room: room || 'TBD',
        status: status || 'Upcoming',
        students: students ?? 0,
      })
      return res.status(200).json({ success: true, class: classItem })
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {}
      if (!id) return res.status(400).json({ success: false, error: 'id required' })
      const classItem = await ClassItem.findByIdAndUpdate(id, updates, { new: true }).lean()
      return res.status(200).json({ success: true, class: classItem })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ success: false, error: 'id required' })
      await ClassItem.findByIdAndDelete(id)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
