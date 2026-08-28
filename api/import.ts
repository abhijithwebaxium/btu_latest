import type { VercelRequest, VercelResponse } from '@vercel/node'
import { importStudentsToDatabase } from '../src/server/studentService.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      const MAX_BYTES = 5 * 1024 * 1024
      if (Buffer.byteLength(body, 'utf8') > MAX_BYTES) {
        return res.status(413).json({ success: false, error: 'Request body too large. Maximum 5 MB allowed.' })
      }
      const result = await importStudentsToDatabase(body)
      return res.status(result.success ? 200 : 400).json(result)
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
