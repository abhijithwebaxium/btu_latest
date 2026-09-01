import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminLoginPage from '../../components/AdminLoginPage'

export const Route = createFileRoute('/admin/login')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('staff-session')) throw redirect({ to: '/' })
  },
  component: AdminLoginPage,
})
