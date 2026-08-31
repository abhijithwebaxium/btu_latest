import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectToDatabase } from '../src/lib/db.js'
import { Internship } from '../src/models/Internship.js'

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
      const internships = await Internship.find().sort({ createdAt: -1 }).lean()
      return res.status(200).json({ success: true, internships })
    }

    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    if (req.method === 'POST') {
      const { company, role, location, stipend, applicants, status, logo } = req.body || {}
      if (!company || !role) {
        return res.status(400).json({ success: false, error: 'company and role required' })
      }
      const internship = await Internship.create({
        company,
        role,
        location: location || 'Remote',
        stipend: stipend || 'N/A',
        applicants: applicants ?? 0,
        status: status || 'Open',
        logo: logo || '🏢',
      })
      return res.status(200).json({ success: true, internship })
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {}
      if (!id) return res.status(400).json({ success: false, error: 'id required' })
      const internship = await Internship.findByIdAndUpdate(id, updates, { new: true }).lean()
      return res.status(200).json({ success: true, internship })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ success: false, error: 'id required' })
      await Internship.findByIdAndDelete(id)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
