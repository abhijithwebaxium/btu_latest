import { createFileRoute, redirect } from '@tanstack/react-router'
import LoginPage from '../components/LoginPage'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const hasStaffSession = localStorage.getItem('staff-session')
    const hasStudentSession = localStorage.getItem('current-student')
    if (hasStaffSession || hasStudentSession) throw redirect({ to: '/' })
  },
  component: LoginPage,
})
