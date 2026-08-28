import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    const { email, password } = req.body || {}
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@btu.ac.in'
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      return res.status(503).json({ success: false, error: 'Admin authentication is not configured on this server.' })
    }

    if (
      typeof email === 'string' &&
      typeof password === 'string' &&
      email.trim().toLowerCase() === adminEmail.toLowerCase() &&
      password === adminPassword
    ) {
      return res.status(200).json({ success: true, role: 'staff' })
    }

    return res.status(401).json({ success: false, error: 'Invalid email or password.' })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
