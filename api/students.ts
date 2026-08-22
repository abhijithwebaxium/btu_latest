import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchStudentsFromDatabase, clearAllStudentsFromDatabase } from '../src/server/studentService'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      const q = (req.query.q as string) || ''
      const result = await fetchStudentsFromDatabase(q)
      return res.status(result.success ? 200 : 500).json(result)
    }

    if (req.method === 'DELETE') {
      const result = await clearAllStudentsFromDatabase()
      return res.status(result.success ? 200 : 500).json(result)
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
