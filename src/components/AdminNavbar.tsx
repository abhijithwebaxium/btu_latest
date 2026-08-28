import { Bell, Menu, Moon, Plus, Search, Sun } from 'lucide-react'
import type { ReactNode } from 'react'

type AdminNavbarProps = {
  theme: string
  searchQuery: string
  onSearchChange: (value: string) => void
  onToggleNavigation: () => void
  onToggleTheme: () => void
  onNewTicket: () => void
  notificationControl?: ReactNode
}

export default function AdminNavbar({
  theme,
  searchQuery,
  onSearchChange,
  onToggleNavigation,
  onToggleTheme,
  onNewTicket,
  notificationControl,
}: AdminNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
      <div className="flex max-w-md flex-1 items-center space-x-4">
        <button
          type="button"
          onClick={onToggleNavigation}
          aria-label="Toggle navigation"
          className="shrink-0 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition-colors hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search students, courses, tickets, assignments..."
            value={searchQuery}
            onChange={event => onSearchChange(event.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 transition-all focus:border-[#ed143d] focus:outline-none focus:ring-1 focus:ring-[#ed143d]"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition-all hover:border-slate-700 hover:text-white"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={onNewTicket}
          className="hidden items-center space-x-2 rounded-xl bg-[#ed143d] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ed143d]/30 transition-all hover:scale-105 hover:bg-rose-700 active:scale-95 sm:flex"
        >
          <Plus className="h-4 w-4" />
          <span>New Ticket</span>
        </button>

        {notificationControl || <button type="button" aria-label="Notifications" className="relative rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition-all hover:border-slate-700 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ed143d] ring-2 ring-slate-950" />
        </button>}
      </div>
    </header>
  )
}
