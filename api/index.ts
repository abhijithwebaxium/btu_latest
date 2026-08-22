import type { IncomingMessage, ServerResponse } from 'http'
import {
  importStudentsToDatabase,
  fetchStudentsFromDatabase,
  clearAllStudentsFromDatabase,
  authenticateStudent,
} from '../src/server/studentService'

export default async function handler(req: IncomingMessage & { query?: Record<string, string>; body?: unknown }, res: ServerResponse & { status: (code: number) => { json: (data: unknown) => void } }) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  const url = req.url || ''

  try {
    if (req.method === 'POST' && url.includes('/auth/student-login')) {
      let bodyStr = ''
      if (typeof req.body === 'object' && req.body !== null) {
        bodyStr = JSON.stringify(req.body)
      } else if (typeof req.body === 'string') {
        bodyStr = req.body
      } else {
        bodyStr = await readBody(req)
      }
      const parsed = JSON.parse(bodyStr || '{}')
      const result = await authenticateStudent(parsed.email, parsed.password)
      res.statusCode = result.success ? 200 : 401
      res.end(JSON.stringify(result))
      return
    }

    if (req.method === 'POST' && url.includes('/students/import')) {
      let bodyStr = ''
      if (typeof req.body === 'string') {
        bodyStr = req.body
      } else if (typeof req.body === 'object' && req.body !== null) {
        bodyStr = JSON.stringify(req.body)
      } else {
        bodyStr = await readBody(req)
      }
      const result = await importStudentsToDatabase(bodyStr)
      res.statusCode = result.success ? 200 : 400
      res.end(JSON.stringify(result))
      return
    }

    if (req.method === 'GET') {
      const urlObj = new URL(url, `http://${req.headers.host || 'localhost'}`)
      const q = urlObj.searchParams.get('q') || ''
      const result = await fetchStudentsFromDatabase(q)
      res.statusCode = result.success ? 200 : 500
      res.end(JSON.stringify(result))
      return
    }

    if (req.method === 'DELETE') {
      const result = await clearAllStudentsFromDatabase()
      res.statusCode = result.success ? 200 : 500
      res.end(JSON.stringify(result))
      return
    }

    res.statusCode = 404
    res.end(JSON.stringify({ success: false, error: 'API route not found' }))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ success: false, error: (err as Error).message }))
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}
