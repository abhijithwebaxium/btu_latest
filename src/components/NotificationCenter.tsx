import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, X, CheckCheck, Trash2, LifeBuoy, Megaphone, Sparkles,
  CheckCircle2, Clock, AlertCircle, RefreshCw,
} from 'lucide-react'

interface Notification {
  _id: string
  kind: string
  title: string
  body: string
  link?: string
  isRead: boolean
  createdAt: string
}

interface Props {
  studentId?: string
  recipientType?: 'STUDENT' | 'ADMIN'
}

const kindIcon: Record<string, React.ElementType> = {
  ticket_opened: LifeBuoy,
  ticket_replied: LifeBuoy,
  ticket_status_changed: Clock,
  ticket_resolved: CheckCircle2,
  system: Sparkles,
  announcement: Megaphone,
}

const kindColor: Record<string, string> = {
  ticket_opened: 'text-[#ed143d] bg-[#ed143d]/10',
  ticket_replied: 'text-blue-400 bg-blue-400/10',
  ticket_status_changed: 'text-amber-400 bg-amber-400/10',
  ticket_resolved: 'text-emerald-400 bg-emerald-400/10',
  system: 'text-violet-400 bg-violet-400/10',
  announcement: 'text-sky-400 bg-sky-400/10',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function NotificationCenter({ studentId, recipientType = 'STUDENT' }: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [toast, setToast] = useState<string | null>(null)
  const prevUnread = useRef<number | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const buildParams = useCallback((extra: Record<string, string> = {}) => {
    const p = new URLSearchParams({ recipientType, ...extra })
    if (studentId) p.set('studentId', studentId)
    return p.toString()
  }, [studentId, recipientType])

  const fetchUnread = useCallback(async () => {
    try {
      const r = await fetch(`/api/notifications?${buildParams({ action: 'unreadCount' })}`)
      const d = await r.json()
      if (d.success) {
        const newCount: number = d.count
        if (recipientType === 'ADMIN' && prevUnread.current !== null && newCount > prevUnread.current) {
          setToast('A new ticket has been created')
          if (toastTimer.current) clearTimeout(toastTimer.current)
          toastTimer.current = setTimeout(() => setToast(null), 10000)
        }
        prevUnread.current = newCount
        setUnread(newCount)
      }
    } catch { /* silent */ }
  }, [buildParams, recipientType])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/notifications?${buildParams({ filter: 'all' })}`)
      const d = await r.json()
      if (d.success) setItems(d.items || [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    fetchUnread()
    const t = setInterval(fetchUnread, 30000)
    return () => clearInterval(t)
  }, [fetchUnread])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', id }),
    })
    setItems(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead', studentId, recipientType }),
    })
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnread(0)
  }

  async function deleteOne(id: string, wasRead: boolean) {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    setItems(prev => prev.filter(n => n._id !== id))
    if (!wasRead) setUnread(prev => Math.max(0, prev - 1))
  }

  const shown = filter === 'unread' ? items.filter(n => !n.isRead) : items

  return (
    <div ref={ref} className="notification-center relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-9999 flex items-center gap-3 rounded-2xl border border-[#ed143d]/30 bg-slate-900 px-5 py-3.5 shadow-2xl shadow-slate-950/60"
          >
            <LifeBuoy className="w-5 h-5 text-[#ed143d] shrink-0" />
            <span className="text-sm font-semibold text-white">{toast}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative rounded-xl border p-2.5 transition-all ${open ? 'border-[#ed143d]/40 bg-[#ed143d]/10 text-[#ed143d]' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'}`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#ed143d] text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-slate-950">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="notification-panel absolute right-0 top-14 z-50 flex max-h-[640px] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/60"
          >
            {/* Header */}
            <div className="notification-banner relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-[#ed143d] via-rose-600 to-rose-700 px-5 py-5">
              <div className="pointer-events-none absolute -right-6 -top-16 h-40 w-40 rounded-full border-[24px] border-white/10" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15"><Bell className="h-5 w-5 text-white" /></div>
                <div><div className="flex items-center gap-2"><span className="text-base font-bold text-white">Notification Inbox</span>
                {unread > 0 && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#ed143d]">
                    {unread} new
                  </span>
                )}</div><p className="mt-0.5 text-[11px] text-white/70">Your latest campus updates</p></div>
              </div>
              <div className="relative flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all as read"
                    className="rounded-lg p-1.5 text-white/75 transition-all hover:bg-white/15 hover:text-white"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={fetchNotifications}
                  title="Refresh"
                  className="rounded-lg p-1.5 text-white/75 transition-all hover:bg-white/15 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-white/75 transition-all hover:bg-white/15 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="grid grid-cols-2 gap-2 border-b border-slate-800 bg-slate-950/30 p-3">
              <button onClick={() => setFilter('all')} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${filter === 'all' ? 'border-[#ed143d]/30 bg-[#ed143d]/10 text-[#ed143d]' : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'}`}>
                <Bell className="h-4 w-4 shrink-0" /><div className="min-w-0"><p className="text-xs font-bold">All updates</p><p className="mt-0.5 text-[9px] opacity-70">{items.length} total</p></div>
              </button>
              <button onClick={() => setFilter('unread')} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${filter === 'unread' ? 'border-[#ed143d]/30 bg-[#ed143d]/10 text-[#ed143d]' : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'}`}>
                <AlertCircle className="h-4 w-4 shrink-0" /><div className="min-w-0"><p className="text-xs font-bold">Unread only</p><p className="mt-0.5 text-[9px] opacity-70">{unread} waiting</p></div>
              </button>
            </div>

            {/* List */}
            <div className="notification-feed flex-1 space-y-2 overflow-y-auto p-3">
              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
                </div>
              ) : shown.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/50"><CheckCheck className="h-6 w-6 text-slate-600" /></div>
                  <p className="text-sm font-semibold text-slate-400">
                    {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">{filter === 'unread' ? 'You have read every notification.' : 'New campus updates will appear here.'}</p>
                </div>
              ) : (
                shown.map(n => {
                  const Icon = kindIcon[n.kind] || Bell
                  const colors = kindColor[n.kind] || 'text-slate-400 bg-slate-800'
                  return (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && markRead(n._id)}
                      className={`notification-item group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all hover:-translate-y-px ${
                        !n.isRead ? 'border-[#ed143d]/20 bg-[#ed143d]/5' : 'border-slate-800 bg-slate-900/40'
                      }`}
                    >
                      <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] font-semibold leading-snug ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                            {n.title}
                          </p>
                          <span className="shrink-0 whitespace-nowrap text-[9px] font-medium text-slate-600">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{n.body}</p>
                        <div className="mt-2 flex items-center gap-2"><span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold capitalize text-slate-400">{n.kind.replaceAll('_', ' ')}</span>{!n.isRead && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#ed143d]"><span className="h-1.5 w-1.5 rounded-full bg-[#ed143d]" />New</span>}</div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteOne(n._id, n.isRead) }}
                        className="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-600 opacity-60 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/30 px-5 py-3">
                <span className="text-[11px] text-slate-600">{items.length} notification{items.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={async () => {
                    await fetch('/api/notifications', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'clearAll', studentId, recipientType }),
                    })
                    setItems([])
                    setUnread(0)
                  }}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
