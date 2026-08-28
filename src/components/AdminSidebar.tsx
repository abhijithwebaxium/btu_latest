import { motion } from 'framer-motion'
import {
  BarChart3, BookOpen, Briefcase, FileJson, Folder, GraduationCap,
  LifeBuoy, LogOut, Users, Video, X,
} from 'lucide-react'

export type AdminSection = 'dashboard' | 'students' | 'import' | 'assignments' | 'classes' | 'internships' | 'projects' | 'tickets'

type AdminSidebarProps = {
  activeItem: AdminSection
  mobileOpen: boolean
  onNavigate: (item: AdminSection) => void
  onClose: () => void
  onSignOut: () => void
  badges?: Partial<Record<AdminSection, string | number | null>>
}

const groups = [
  { label: 'Overview', items: [{ id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 }] },
  { label: 'Academics', items: [
    { id: 'students' as const, label: 'Students DB', icon: Users },
    { id: 'import' as const, label: 'Import JSON', icon: FileJson },
    { id: 'assignments' as const, label: 'Assignments', icon: BookOpen },
    { id: 'classes' as const, label: 'Classes', icon: Video },
  ] },
  { label: 'Career & Research', items: [
    { id: 'internships' as const, label: 'Internships', icon: Briefcase },
    { id: 'projects' as const, label: 'Projects', icon: Folder },
  ] },
  { label: 'Support', items: [{ id: 'tickets' as const, label: 'Support Tickets', icon: LifeBuoy }] },
]

export default function AdminSidebar({ activeItem, mobileOpen, onNavigate, onClose, onSignOut, badges = {} }: AdminSidebarProps) {
  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col justify-between overflow-y-auto border-r border-slate-800 bg-slate-900/95 backdrop-blur-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          <div className="flex items-center gap-3 border-b border-slate-800/80 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#ed143d] to-rose-500 shadow-lg shadow-[#ed143d]/30"><GraduationCap className="h-6 w-6 text-white" /></div>
            <div><h1 className="flex items-center text-[14px] font-extrabold tracking-wide text-white">BTU <span className="ml-1 rounded border border-[#ed143d]/30 bg-[#ed143d]/20 px-1.5 py-0.5 font-mono text-[10px] text-[#ed143d]">Campus OS</span></h1><p className="text-[11px] font-medium text-slate-400">Bir Tikendrajit University</p></div>
            <button type="button" aria-label="Close navigation" onClick={onClose} className="ml-auto text-slate-400 lg:hidden"><X className="h-5 w-5" /></button>
          </div>
          <nav className="space-y-5 p-4">
            {groups.map(group => <div key={group.label}>
              <p className="mb-2 px-4 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
              <div className="space-y-1">{group.items.map(item => {
                const active = activeItem === item.id
                const Icon = item.icon
                const badge = badges[item.id]
                return <button key={item.id} type="button" onClick={() => onNavigate(item.id)} className={`sidebar-nav-item group relative flex w-full items-center justify-between rounded-xl px-4 py-2.5 font-medium transition-all duration-200 ${active ? 'font-semibold text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                  {active && <motion.div layoutId="admin-sidebar-active" className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ed143d] to-rose-600 shadow-lg shadow-[#ed143d]/30" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <div className="relative z-10 flex items-center gap-3"><Icon className={`h-[18px] w-[18px] ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} /><span className="sidebar-nav-label">{item.label}</span></div>
                  {badge != null && <span className={`relative z-10 rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'}`}>{badge}</span>}
                </button>
              })}</div>
            </div>)}
          </nav>
        </div>
        <div className="m-3 flex items-center justify-between rounded-2xl border-t border-slate-800/80 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-[#ed143d] text-white"><GraduationCap className="h-5 w-5" /></div><div><p className="text-xs font-semibold text-white">BTU Admin</p><p className="text-xs text-slate-400">Staff Portal</p></div></div>
          <button type="button" onClick={onSignOut} aria-label="Log out" title="Log out" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[#ed143d]/10 hover:text-[#ed143d]"><LogOut className="h-4 w-4" /></button>
        </div>
      </aside>
    </>
  )
}
