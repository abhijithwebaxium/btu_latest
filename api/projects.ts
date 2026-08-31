import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectToDatabase } from '../src/lib/db.js'
import { Project } from '../src/models/Project.js'

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
      const projects = await Project.find().sort({ createdAt: -1 }).lean()
      return res.status(200).json({ success: true, projects })
    }

    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    if (req.method === 'POST') {
      const { title, lead, tech, progress, status, category } = req.body || {}
      if (!title || !lead) {
        return res.status(400).json({ success: false, error: 'title and lead required' })
      }
      const project = await Project.create({
        title,
        lead,
        tech: Array.isArray(tech) ? tech : [],
        progress: progress ?? 0,
        status: status || 'Development',
        category: category || 'General',
      })
      return res.status(200).json({ success: true, project })
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {}
      if (!id) return res.status(400).json({ success: false, error: 'id required' })
      const project = await Project.findByIdAndUpdate(id, updates, { new: true }).lean()
      return res.status(200).json({ success: true, project })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ success: false, error: 'id required' })
      await Project.findByIdAndDelete(id)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
