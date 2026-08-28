import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import AdminNavbar from './AdminNavbar'
import AdminSidebar, { type AdminSection } from './AdminSidebar'

type AppTheme = 'dark' | 'light'
type Props = { activeItem: 'students' | 'import'; children: ReactNode }

function getActiveTheme(): AppTheme {
  if (typeof document !== 'undefined') {
    const applied = document.documentElement.dataset.theme
    if (applied === 'light' || applied === 'dark') return applied
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('university-theme')
    if (saved === 'light' || saved === 'dark') return saved
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  }
  return 'dark'
}

export default function AdminPageShell({ activeItem, children }: Props) {
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme] = useState<AppTheme>(getActiveTheme)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const activeTheme = getActiveTheme()
    setTheme(activeTheme)
    document.documentElement.dataset.theme = activeTheme
  }, [])

  const navigateTo = (id: AdminSection) => {
    setMobileNavOpen(false)
    if (id === 'students') navigate({ to: '/students' })
    else if (id === 'import') navigate({ to: '/import' })
    else {
      sessionStorage.setItem('admin-active-tab', id)
      navigate({ to: '/' })
    }
  }

  const toggleTheme = () => {
    const next: AppTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('university-theme', next)
  }

  const signOut = () => {
    localStorage.removeItem('staff-session')
    localStorage.removeItem('current-student')
    localStorage.removeItem('admin-key')
    navigate({ to: '/login' })
  }

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <AdminSidebar activeItem={activeItem} mobileOpen={mobileNavOpen} onNavigate={navigateTo} onClose={() => setMobileNavOpen(false)} onSignOut={signOut} badges={{ students: 'MongoDB', import: 'BTU ERP', classes: 'Live' }} />
    <main className="min-h-screen lg:ml-[260px]">
      <AdminNavbar theme={theme} searchQuery={searchQuery} onSearchChange={setSearchQuery} onToggleNavigation={() => setMobileNavOpen(prev => !prev)} onToggleTheme={toggleTheme} onNewTicket={() => navigateTo('tickets')} />
      {children}
    </main>
  </div>
}
