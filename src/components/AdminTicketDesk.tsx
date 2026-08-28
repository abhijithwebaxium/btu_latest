import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LifeBuoy, RefreshCw, ChevronLeft, Send, Loader2,
  CheckCircle2, MessageSquare, Filter,
} from 'lucide-react'

interface Thread {
  _id: string
  studentId: string
  studentName?: string
  subject: string
  status: string
  priority: string
  category: string
  lastMessageAt: string
  createdAt: string
}

interface Message {
  _id: string
  senderType: 'student' | 'admin'
  senderName: string
  body: string
  createdAt: string
}

const STATUS_OPTIONS = ['all', 'open', 'in_progress', 'resolution_pending', 'resolved', 'closed']

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open:               { label: 'Open',           color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress:        { label: 'In Progress',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resolution_pending: { label: 'Pending',        color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  resolved:           { label: 'Resolved',       color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  closed:             { label: 'Closed',         color: 'bg-slate-700 text-slate-400 border-slate-600' },
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  high:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  normal: 'bg-slate-800 text-slate-300 border-slate-700',
  low:    'bg-slate-800/50 text-slate-500 border-slate-800',
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(d).toLocaleDateString()
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || { label: status, color: 'bg-slate-800 text-slate-400 border-slate-700' }
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>
      {s.label}
    </span>
  )
}

function getAdminKey(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('admin-key') || ''
}

export default function AdminTicketDesk() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [total, setTotal] = useState(0)
  const msgEndRef = useRef<HTMLDivElement>(null)
  const prevMsgCount = useRef(0)
  const activeThreadRef = useRef<Thread | null>(null)
  activeThreadRef.current = activeThread

  const fetchThreads = useCallback(async (silent = false) => {
    if (!silent) setLoadingThreads(true)
    try {
      const params = new URLSearchParams({ action: 'allThreads', status: statusFilter })
      const r = await fetch(`/api/support?${params}`, {
        headers: { 'x-admin-key': getAdminKey() },
      })
      const d = await r.json()
      if (d.success) { setThreads(d.threads || []); setTotal(d.total || 0) }
    } catch { /* silent */ } finally {
      if (!silent) setLoadingThreads(false)
    }
  }, [statusFilter])

  const fetchMessages = useCallback(async (threadId: string, silent = false) => {
    if (!silent) setLoadingMessages(true)
    try {
      const r = await fetch(`/api/support?action=thread&threadId=${threadId}`, {
        headers: { 'x-admin-key': getAdminKey() },
      })
      const d = await r.json()
      if (d.success) setMessages(d.messages || [])
    } catch { /* silent */ } finally {
      if (!silent) setLoadingMessages(false)
    }
  }, [])

  // Initial loads
  useEffect(() => { fetchThreads() }, [fetchThreads])
  useEffect(() => { if (activeThread) { prevMsgCount.current = 0; fetchMessages(activeThread._id) } }, [activeThread, fetchMessages])

  // Real-time polling
  useEffect(() => {
    const t = setInterval(() => fetchThreads(true), 8000)
    return () => clearInterval(t)
  }, [fetchThreads])

  useEffect(() => {
    if (!activeThread) return
    const t = setInterval(() => fetchMessages(activeThread._id, true), 4000)
    return () => clearInterval(t)
  }, [activeThread, fetchMessages])

  // Scroll to bottom only when new messages arrive
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMsgCount.current = messages.length
  }, [messages])

  async function sendReply() {
    if (!reply.trim() || !activeThread) return
    setSending(true)
    try {
      const r = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
        body: JSON.stringify({
          action: 'sendMessage',
          threadId: activeThread._id,
          senderType: 'admin',
          senderId: 'admin',
          senderName: 'BTU Admin',
          body: reply.trim(),
        }),
      })
      const d = await r.json()
      if (d.success) {
        setReply('')
        await fetchMessages(activeThread._id)
        await fetchThreads()
      }
    } finally {
      setSending(false)
    }
  }

  async function changeStatus(status: string) {
    if (!activeThread) return
    setUpdatingStatus(true)
    try {
      const r = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
        body: JSON.stringify({
          action: 'updateStatus',
          threadId: activeThread._id,
          status,
          actorName: 'BTU Admin',
        }),
      })
      const d = await r.json()
      if (d.success) {
        setActiveThread(prev => prev ? { ...prev, status } : null)
        await fetchThreads()
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="admin-ticket-desk space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Campus Support Helpdesk
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </h2>
          <p className="text-slate-400 text-sm">{total} total ticket{total !== 1 ? 's' : ''} · Auto-refreshes every 8s</p>
        </div>
        <button
          onClick={() => fetchThreads()}
          className="self-start flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all border border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${loadingThreads ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 flex-wrap">
        <Filter className="w-4 h-4 text-slate-600 mr-1" />
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setActiveThread(null) }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
              statusFilter === s
                ? 'bg-[#ed143d] text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]?.label || s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread list */}
        <div className="lg:col-span-1 space-y-2">
          {loadingThreads && threads.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <LifeBuoy className="w-8 h-8 mx-auto mb-3 text-slate-700" />
              <p className="text-sm text-slate-500">No tickets found</p>
            </div>
          ) : (
            threads.map(t => (
              <button
                key={t._id}
                onClick={() => setActiveThread(t)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeThread?._id === t._id
                    ? 'border-[#ed143d]/50 bg-[#ed143d]/5'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{t.subject}</p>
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-[11px] text-slate-400 mb-1.5">{t.studentName || t.studentId}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className={`px-1.5 py-0.5 rounded border font-bold capitalize ${PRIORITY_COLORS[t.priority] || ''}`}>
                    {t.priority}
                  </span>
                  <span className="capitalize">{t.category}</span>
                  <span className="ml-auto">{timeAgo(t.lastMessageAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Thread view */}
        <div className="lg:col-span-2">
          {!activeThread ? (
            <div className="h-full min-h-[350px] rounded-2xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-sm text-slate-500">Select a ticket to view messages</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl flex flex-col" style={{ minHeight: 480 }}>
              {/* Header */}
              <div className="p-4 border-b border-slate-800 space-y-2">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setActiveThread(null)}
                    className="lg:hidden shrink-0 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{activeThread.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      From: <span className="text-slate-300">{activeThread.studentName || activeThread.studentId}</span>
                      {' · '}<span className="capitalize">{activeThread.category}</span>
                    </p>
                  </div>
                </div>

                {/* Status controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Set status:</span>
                  {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      disabled={updatingStatus || activeThread.status === s}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all border disabled:opacity-50 ${
                        activeThread.status === s
                          ? STATUS_LABELS[s]?.color || ''
                          : 'bg-slate-800/60 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      {updatingStatus && activeThread.status !== s ? (
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      ) : (
                        STATUS_LABELS[s]?.label || s
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                  </div>
                ) : messages.map(msg => {
                  const isAdmin = msg.senderType === 'admin'
                  return (
                    <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-[#ed143d] text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                        }`}>
                          {msg.body}
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] text-slate-600 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                          <span className="font-medium">{isAdmin ? 'You (Admin)' : msg.senderName}</span>
                          <span>·</span>
                          <span>{timeAgo(msg.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Reply */}
              {activeThread.status !== 'resolved' && activeThread.status !== 'closed' ? (
                <div className="p-4 border-t border-slate-800">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                      placeholder="Reply to student… (Enter to send)"
                      rows={2}
                      className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:border-[#ed143d] focus:outline-none resize-none"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      className="shrink-0 p-3 bg-[#ed143d] hover:bg-rose-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ed143d]/30"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-800 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ticket is {activeThread.status}. Reopen by setting status to "Open".</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
