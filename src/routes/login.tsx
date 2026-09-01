import { createFileRoute, redirect } from '@tanstack/react-router'
import LoginPage from '../components/LoginPage'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('current-student')) throw redirect({ to: '/' })
    if (localStorage.getItem('staff-session')) throw redirect({ to: '/admin/login' })
  },
  component: LoginPage,
})
