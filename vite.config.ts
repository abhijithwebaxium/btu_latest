import { defineConfig, Plugin } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
        const pathname = urlObj.pathname

        res.setHeader('Content-Type', 'application/json')

        try {
          const { importStudentsToDatabase, fetchStudentsFromDatabase, clearAllStudentsFromDatabase, authenticateStudent } = await import('./src/server/studentService.js')

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

          if (req.method === 'POST' && pathname === '/api/students/import') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
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

          if (req.method === 'DELETE' && pathname === '/api/students') {
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

export default defineConfig({
  plugins: [
    apiServerPlugin(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
