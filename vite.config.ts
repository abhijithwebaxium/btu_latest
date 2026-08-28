import { defineConfig, Plugin, loadEnv } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'

function apiServerPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
        const pathname = urlObj.pathname

        res.setHeader('Content-Type', 'application/json')

        try {
          const { importStudentsToDatabase, fetchStudentsFromDatabase, clearAllStudentsFromDatabase, authenticateStudent, updateEvaluationSubjects } = await import('./src/server/studentService.js')

          if (req.method === 'POST' && pathname === '/api/auth/student-login') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body)
                const result = await authenticateStudent(parsed.email, parsed.password)
                res.statusCode = result.success ? 200 : 401
                res.end(JSON.stringify(result))
              } catch (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ success: false, error: (err as Error).message }))
              }
            })
            return
          }

          if (req.method === 'POST' && pathname === '/api/auth/admin-login') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const { email, password } = JSON.parse(body)
                const adminEmail = env.ADMIN_EMAIL || 'admin@btu.ac.in'
                const adminPassword = env.ADMIN_PASSWORD
                if (!adminPassword) {
                  res.statusCode = 503
                  res.end(JSON.stringify({ success: false, error: 'Admin authentication is not configured on this server.' }))
                  return
                }
                if (
                  typeof email === 'string' &&
                  typeof password === 'string' &&
                  email.trim().toLowerCase() === adminEmail.toLowerCase() &&
                  password === adminPassword
                ) {
                  res.statusCode = 200
                  res.end(JSON.stringify({ success: true, role: 'staff' }))
                } else {
                  res.statusCode = 401
                  res.end(JSON.stringify({ success: false, error: 'Invalid email or password.' }))
                }
              } catch (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ success: false, error: (err as Error).message }))
              }
            })
            return
          }

          if (req.method === 'POST' && pathname === '/api/students/import') {
            let body = ''
            const MAX_BYTES = 5 * 1024 * 1024
            let exceeded = false
            req.on('data', (chunk: Buffer) => {
              body += chunk
              if (Buffer.byteLength(body, 'utf8') > MAX_BYTES) exceeded = true
            })
            req.on('end', async () => {
              if (exceeded) {
                res.statusCode = 413
                res.end(JSON.stringify({ success: false, error: 'Request body too large. Maximum 5 MB allowed.' }))
                return
              }
              try {
                const result = await importStudentsToDatabase(body)
                res.statusCode = result.success ? 200 : 400
                res.end(JSON.stringify(result))
              } catch (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ success: false, error: (err as Error).message }))
              }
            })
            return
          }

          if (req.method === 'GET' && pathname === '/api/students') {
            const q = urlObj.searchParams.get('q') || ''
            const result = await fetchStudentsFromDatabase(q)
            res.statusCode = result.success ? 200 : 500
            res.end(JSON.stringify(result))
            return
          }

          if (req.method === 'POST' && pathname === '/api/evaluation/update-subjects') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const rows = JSON.parse(body)
                if (!Array.isArray(rows)) { res.statusCode = 400; res.end(JSON.stringify({ success: false, error: 'Expected a JSON array of subject rows.' })); return }
                const result = await updateEvaluationSubjects(rows)
                res.statusCode = 200
                res.end(JSON.stringify(result))
              } catch (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ success: false, error: (err as Error).message }))
              }
            })
            return
          }

          if (req.method === 'DELETE' && pathname === '/api/students') {
            const adminKey = env.ADMIN_PASSWORD
            if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
              res.statusCode = 403
              res.end(JSON.stringify({ success: false, error: 'Forbidden: valid X-Admin-Key header required.' }))
              return
            }
            const result = await clearAllStudentsFromDatabase()
            res.statusCode = result.success ? 200 : 500
            res.end(JSON.stringify(result))
            return
          }

          next()
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: (err as Error).message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      apiServerPlugin(env),
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      viteReact(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }
})
