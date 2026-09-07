export const TICKET_CATEGORIES = ['assignment', 'project', 'internship'] as const
export type TicketCategory = typeof TICKET_CATEGORIES[number]

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open:               { label: 'Open',           color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress:        { label: 'In Progress',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resolution_pending: { label: 'Pending Review', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  resolved:           { label: 'Resolved',       color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  closed:             { label: 'Closed',         color: 'bg-slate-700 text-slate-400 border-slate-600' },
}

export const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  high:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  normal: 'bg-slate-800 text-slate-300 border-slate-700',
  low:    'bg-slate-800/50 text-slate-500 border-slate-800',
}

export const CATEGORY_SOURCE: Record<string, { label: string; color: string }> = {
  assignment: { label: 'Assignment', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  project:    { label: 'Project',    color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  internship: { label: 'Internship', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
