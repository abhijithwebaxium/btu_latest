import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectToDatabase } from '../src/lib/db.js'
import { Assignment } from '../src/models/Assignment.js'

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
      const assignments = await Assignment.find().sort({ createdAt: -1 }).lean()
      return res.status(200).json({ success: true, assignments })
    }

    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    if (req.method === 'POST') {
      const { title, course, deadline, submitted, total, status, priority } = req.body || {}
      if (!title || !course || !deadline) {
        return res.status(400).json({ success: false, error: 'title, course, deadline required' })
      }
      const assignment = await Assignment.create({
        title,
        course,
        deadline,
        submitted: submitted ?? 0,
        total: total ?? 50,
        status: status || 'Active',
        priority: priority || 'Medium',
      })
      return res.status(200).json({ success: true, assignment })
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {}
      if (!id) return res.status(400).json({ success: false, error: 'id required' })
      const assignment = await Assignment.findByIdAndUpdate(id, updates, { new: true }).lean()
      return res.status(200).json({ success: true, assignment })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ success: false, error: 'id required' })
      await Assignment.findByIdAndDelete(id)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
