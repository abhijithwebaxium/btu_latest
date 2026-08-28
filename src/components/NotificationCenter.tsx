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
      if (d.success) setUnread(d.count)
    } catch { /* silent */ }
  }, [buildParams])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/notifications?${buildParams({ filter })}`)
      const d = await r.json()
      if (d.success) setItems(d.items || [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [buildParams, filter])

  useEffect(() => {
    fetchUnread()
    const t = setInterval(fetchUnread, 30000)
    return () => clearInterval(t)
  }, [fetchUnread])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, filter, fetchNotifications])

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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
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
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-[380px] max-h-[560px] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/60 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#ed143d]" />
                <span className="text-sm font-bold text-white">Notifications</span>
                {unread > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ed143d]/20 text-[#ed143d]">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={fetchNotifications}
                  title="Refresh"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-4 pt-2.5 pb-1">
              {(['all', 'unread'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
                    filter === f
                      ? 'bg-[#ed143d] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
                </div>
              ) : shown.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <Bell className="w-8 h-8 text-slate-700 mb-3" />
                  <p className="text-sm text-slate-500">
                    {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                shown.map(n => {
                  const Icon = kindIcon[n.kind] || Bell
                  const colors = kindColor[n.kind] || 'text-slate-400 bg-slate-800'
                  return (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && markRead(n._id)}
                      className={`group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-800/50 ${
                        !n.isRead ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colors}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-snug ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="shrink-0 w-2 h-2 mt-1 rounded-full bg-[#ed143d]" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteOne(n._id, n.isRead) }}
                        className="shrink-0 mt-1 p-1 rounded text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
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
              <div className="border-t border-slate-800 px-4 py-2.5 flex items-center justify-between">
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
