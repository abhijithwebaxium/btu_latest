import { createFileRoute, redirect } from '@tanstack/react-router'
import Dashboard from '../components/Dashboard'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const hasAuth = localStorage.getItem('staff-session') || localStorage.getItem('current-student')
    if (!hasAuth) throw redirect({ to: '/login' })
  },
  component: Dashboard,
})
