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
          const { createAnnouncement, getAllAnnouncements, getActiveAnnouncementsForStudent, deleteAnnouncement } = await import('./src/server/announcementService.js')

          if (req.method === 'POST' && pathname === '/api/auth/student-login') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body)
                const result = await authenticateStudent(parsed.phone, parsed.dob)
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

          // ── Announcements ─────────────────────────────────────────────────
          if (pathname === '/api/announcements') {
            const isAdmin = req.headers['x-admin-key'] === env.ADMIN_PASSWORD
            if (req.method === 'GET') {
              const mode = urlObj.searchParams.get('mode')
              if (mode === 'admin') {
                if (!isAdmin) { res.statusCode = 403; res.end(JSON.stringify({ success: false, error: 'Forbidden' })); return }
                res.end(JSON.stringify(await getAllAnnouncements())); return
              }
              const result = await getActiveAnnouncementsForStudent({
                studentId:     urlObj.searchParams.get('studentId')     || '',
                enrollmentID:  urlObj.searchParams.get('enrollmentID')  || undefined,
                applicationID: urlObj.searchParams.get('applicationID') || undefined,
                branch:        urlObj.searchParams.get('branch')        || undefined,
              })
              res.end(JSON.stringify(result)); return
            }
            if (req.method === 'POST') {
              if (!isAdmin) { res.statusCode = 403; res.end(JSON.stringify({ success: false, error: 'Forbidden' })); return }
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', async () => {
                try {
                  const result = await createAnnouncement(JSON.parse(body))
                  res.statusCode = 201; res.end(JSON.stringify(result))
                } catch (err) { res.statusCode = 500; res.end(JSON.stringify({ success: false, error: (err as Error).message })) }
              }); return
            }
            if (req.method === 'DELETE') {
              if (!isAdmin) { res.statusCode = 403; res.end(JSON.stringify({ success: false, error: 'Forbidden' })); return }
              const id = urlObj.searchParams.get('id') || ''
              if (!id) { res.statusCode = 400; res.end(JSON.stringify({ success: false, error: 'id required' })); return }
              res.end(JSON.stringify(await deleteAnnouncement(id))); return
            }
          }

          // ── Notifications ──────────────────────────────────────────────────
          if (pathname === '/api/notifications') {
            const { listNotifications, getUnreadCount, markAsRead, markAllAsRead, softDeleteNotification, clearAllNotifications, createNotification } =
              await import('./src/server/notificationService.js')

            if (req.method === 'GET') {
              const p = urlObj.searchParams
              const recipientType = (p.get('recipientType') || 'STUDENT') as 'STUDENT' | 'ADMIN'
              const studentId = p.get('studentId') || undefined

              if (p.get('action') === 'unreadCount') {
                const count = await getUnreadCount({ studentId, recipientType })
                res.end(JSON.stringify({ success: true, count }))
                return
              }

              const result = await listNotifications({
                studentId,
                recipientType,
                filter: (p.get('filter') || 'all') as 'all' | 'unread' | 'read',
                page: p.get('page') ? parseInt(p.get('page')!) : 1,
                limit: p.get('limit') ? parseInt(p.get('limit')!) : 20,
              })
              res.end(JSON.stringify({ success: true, ...result }))
              return
            }

            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', async () => {
                try {
                  const b = JSON.parse(body)
                  const recipientType = (b.recipientType || 'STUDENT') as 'STUDENT' | 'ADMIN'
                  if (b.action === 'markRead') { await markAsRead(b.id); res.end(JSON.stringify({ success: true })); return }
                  if (b.action === 'markAllRead') { await markAllAsRead({ studentId: b.studentId, recipientType }); res.end(JSON.stringify({ success: true })); return }
                  if (b.action === 'delete') { await softDeleteNotification(b.id); res.end(JSON.stringify({ success: true })); return }
                  if (b.action === 'clearAll') { await clearAllNotifications({ studentId: b.studentId, recipientType }); res.end(JSON.stringify({ success: true })); return }
                  if (b.action === 'create') { const n = await createNotification(b.data); res.end(JSON.stringify({ success: true, notification: n })); return }
                  res.statusCode = 400; res.end(JSON.stringify({ success: false, error: 'Unknown action' }))
                } catch (err) { res.statusCode = 500; res.end(JSON.stringify({ success: false, error: (err as Error).message })) }
              })
              return
            }
          }

          // ── Support tickets ────────────────────────────────────────────────
          if (pathname === '/api/support') {
            const { getStudentThreads, getThread, createThread, sendMessage, updateThreadStatus, getAllThreads } =
              await import('./src/server/supportService.js')

            const isAdmin = req.headers['x-admin-key'] === env.ADMIN_PASSWORD

            if (req.method === 'GET') {
              const p = urlObj.searchParams
              const action = p.get('action')

              if (action === 'studentThreads') {
                const threads = await getStudentThreads(p.get('studentId') || '')
                res.end(JSON.stringify({ success: true, threads })); return
              }
              if (action === 'thread') {
                const data = await getThread(p.get('threadId') || '')
                if (!data) { res.statusCode = 404; res.end(JSON.stringify({ success: false, error: 'Not found' })); return }
                res.end(JSON.stringify({ success: true, ...data })); return
              }
              if (action === 'allThreads') {
                if (!isAdmin) { res.statusCode = 403; res.end(JSON.stringify({ success: false, error: 'Forbidden' })); return }
                const result = await getAllThreads({ status: p.get('status') || undefined, page: p.get('page') ? parseInt(p.get('page')!) : 1, limit: 30 })
                res.end(JSON.stringify({ success: true, ...result })); return
              }
              res.statusCode = 400; res.end(JSON.stringify({ success: false, error: 'Unknown action' })); return
            }

            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', async () => {
                try {
                  const b = JSON.parse(body)
                  if (b.action === 'createThread') {
                    const thread = await createThread({ studentId: b.studentId, studentName: b.studentName || 'Student', subject: b.subject, body: b.body, category: b.category, priority: b.priority })
                    res.end(JSON.stringify({ success: true, thread })); return
                  }
                  if (b.action === 'sendMessage') {
                    if (b.senderType === 'admin' && !isAdmin) { res.statusCode = 403; res.end(JSON.stringify({ success: false, error: 'Forbidden' })); return }
                    const msg = await sendMessage({ threadId: b.threadId, senderType: b.senderType, senderId: b.senderId, senderName: b.senderName || b.senderType, body: b.body })
                    res.end(JSON.stringify({ success: true, message: msg })); return
                  }
                  if (b.action === 'updateStatus') {
                    if (!isAdmin) { res.statusCode = 403; res.end(JSON.stringify({ success: false, error: 'Forbidden' })); return }
                    await updateThreadStatus({ threadId: b.threadId, status: b.status, actorName: b.actorName || 'Admin', actorType: 'admin' })
                    res.end(JSON.stringify({ success: true })); return
                  }
                  res.statusCode = 400; res.end(JSON.stringify({ success: false, error: 'Unknown action' }))
                } catch (err) { res.statusCode = 500; res.end(JSON.stringify({ success: false, error: (err as Error).message })) }
              })
              return
            }
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
