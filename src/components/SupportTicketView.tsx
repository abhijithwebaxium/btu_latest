import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LifeBuoy, Plus, X, Send, ChevronLeft, Clock, CheckCircle2,
  AlertCircle, RefreshCw, MessageSquare, Loader2, RotateCcw, Filter,
} from 'lucide-react'

export interface Thread {
  _id: string
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

interface Event {
  _id: string
  eventType: string
  actorName: string
  actorType: string
  oldValue?: string
  newValue?: string
  createdAt: string
}

type TimelineItem = { kind: 'message'; data: Message } | { kind: 'event'; data: Event }

interface Props {
  studentId: string
  studentName: string
  initialThread?: Thread | null
  categoryFilter?: 'assignment' | 'project'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open:               { label: 'Open',              color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress:        { label: 'In Progress',       color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resolution_pending: { label: 'Pending Review',    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  resolved:           { label: 'Resolved',          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  closed:             { label: 'Closed',            color: 'bg-slate-700 text-slate-400 border-slate-600' },
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
  const s = STATUS_LABELS[status] || { label: status, color: 'bg-slate-800 text-slate-400' }
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>
      {s.label}
    </span>
  )
}

export default function SupportTicketView({ studentId, studentName, initialThread, categoryFilter }: Props) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [reopening, setReopening] = useState(false)
  const [statusFilter, setStatusFilter] = useState('open')
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [newPriority, setNewPriority] = useState('normal')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const msgEndRef = useRef<HTMLDivElement>(null)
  const prevMsgCount = useRef(0)

  const fetchThreads = useCallback(async (silent = false) => {
    if (!silent) setLoadingThreads(true)
    try {
      const r = await fetch(`/api/support?action=studentThreads&studentId=${encodeURIComponent(studentId)}`)
      const d = await r.json()
      if (d.success) setThreads(d.threads || [])
    } catch { /* silent */ } finally {
      if (!silent) setLoadingThreads(false)
    }
  }, [studentId])

  const fetchMessages = useCallback(async (threadId: string, silent = false) => {
    if (!silent) setLoadingMessages(true)
    try {
      const r = await fetch(`/api/support?action=thread&threadId=${threadId}`)
      const d = await r.json()
      if (d.success) {
        setMessages(d.messages || [])
        if (Array.isArray(d.events)) {
          setEvents(d.events.filter((e: Event) => e.eventType === 'status_changed'))
        }
        if (d.thread) setActiveThread(prev => prev && prev.status !== d.thread.status ? { ...prev, status: d.thread.status } : prev)
      }
    } catch { /* silent */ } finally {
      if (!silent) setLoadingMessages(false)
    }
  }, [])

  // Initial loads
  useEffect(() => { fetchThreads() }, [fetchThreads])
  useEffect(() => { if (activeThread) { prevMsgCount.current = 0; fetchMessages(activeThread._id) } }, [activeThread, fetchMessages])
  useEffect(() => { if (initialThread) { setShowNewForm(false); setActiveThread(initialThread) } }, [initialThread])

  // Real-time polling
  useEffect(() => {
    const t = setInterval(() => fetchThreads(true), 10000)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          threadId: activeThread._id,
          senderType: 'student',
          senderId: studentId,
          senderName: studentName,
          body: reply.trim(),
        }),
      })
      const d = await r.json()
      if (d.success) {
        setReply('')
        await fetchMessages(activeThread._id, true)
        await fetchThreads(true)
      }
    } finally {
      setSending(false)
    }
  }

  async function reopenTicket() {
    if (!activeThread) return
    setReopening(true)
    try {
      const r = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reopenThread', threadId: activeThread._id, studentId, studentName }),
      })
      const d = await r.json()
      if (d.success) {
        await fetchMessages(activeThread._id, true)
        await fetchThreads(true)
      }
    } finally {
      setReopening(false)
    }
  }

  async function submitNewTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubject.trim() || !newBody.trim()) return
    setFormError('')
    setSubmitting(true)
    try {
      const r = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createThread',
          studentId,
          studentName,
          subject: newSubject.trim(),
          body: newBody.trim(),
          category: newCategory,
          priority: newPriority,
        }),
      })
      const d = await r.json()
      if (d.success) {
        setShowNewForm(false)
        setNewSubject('')
        setNewBody('')
        setNewCategory('general')
        setNewPriority('normal')
        setFormError('')
        await fetchThreads()
        setActiveThread(d.thread)
      } else {
        setFormError(d.error || 'Failed to submit ticket. Please try again.')
      }
    } catch (err) {
      setFormError((err as Error).message || 'Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const pageTitle = categoryFilter === 'assignment'
    ? 'Assignment Chats'
    : categoryFilter === 'project'
      ? 'Project Chats'
      : 'Support Tickets'

  const pageDesc = categoryFilter === 'assignment'
    ? 'Chats you opened from your assignment cards.'
    : categoryFilter === 'project'
      ? 'Chats you opened from your project cards.'
      : 'Submit and track your support requests.'

  const categoryThreads = categoryFilter
    ? threads.filter(t => t.category === categoryFilter)
    : threads.filter(t => t.category !== 'assignment' && t.category !== 'project')

  const visibleThreads = statusFilter === 'all'
    ? categoryThreads
    : categoryThreads.filter(t => t.status === statusFilter)

  return (
    <div className="student-support-center space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {pageTitle}
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </h2>
          <p className="text-slate-400 text-sm">{pageDesc}</p>
        </div>
        {!categoryFilter && (
          <button
            onClick={() => { setShowNewForm(true); setActiveThread(null) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ed143d] hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#ed143d]/30 transition-all"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        )}
      </div>

      {/* New ticket form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-[#ed143d]" /> Submit New Ticket
              </h3>
              <button onClick={() => { setShowNewForm(false); setFormError('') }} className="p-1.5 text-slate-500 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitNewTicket} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Subject</label>
                <input
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  required
                  placeholder="Brief description of your issue"
                  className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:border-[#ed143d] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="exams">Exams</option>
                    <option value="documents">Documents</option>
                    <option value="fee">Fee / Payment</option>
                    <option value="technical">Technical</option>
                    <option value="administration">Administration</option>
                    <option value="facility">Facility</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Message</label>
                <textarea
                  value={newBody}
                  onChange={e => setNewBody(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe your issue in detail..."
                  className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:border-[#ed143d] focus:outline-none resize-none"
                />
              </div>
              {formError && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowNewForm(false); setFormError('') }} className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#ed143d] hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#ed143d]/30 disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Tickets</span>
            <button onClick={() => fetchThreads()} className="p-1 text-slate-600 hover:text-white rounded transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingThreads ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <Filter className="w-3.5 h-3.5 text-slate-600 shrink-0 mr-0.5" />
            {(['all', 'open', 'in_progress', 'resolution_pending', 'resolved'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setActiveThread(null) }}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all capitalize ${
                  statusFilter === s
                    ? 'bg-[#ed143d] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s === 'resolution_pending' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {loadingThreads && threads.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            </div>
          ) : visibleThreads.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <LifeBuoy className="w-8 h-8 mx-auto mb-3 text-slate-700" />
              <p className="text-sm text-slate-500">No chats yet.</p>
              <p className="text-xs text-slate-600 mt-1">
                {categoryFilter ? 'Use the Chat button on your subject cards.' : 'Click "New Ticket" to get help.'}
              </p>
            </div>
          ) : (
            visibleThreads.map(t => (
              <button
                key={t._id}
                onClick={() => { setActiveThread(t); setShowNewForm(false) }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeThread?._id === t._id
                    ? 'border-[#ed143d]/50 bg-[#ed143d]/5'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-white leading-snug line-clamp-1">{t.subject}</p>
                  <StatusBadge status={t.status} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold capitalize ${PRIORITY_COLORS[t.priority] || ''}`}>
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
            <div className="h-full min-h-75 rounded-2xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-sm text-slate-500">Select a ticket to view messages</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl flex flex-col" style={{ minHeight: 480 }}>
              {/* Thread header */}
              <div className="flex items-start justify-between p-4 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveThread(null)}
                    className="lg:hidden shrink-0 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{activeThread.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={activeThread.status} />
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${PRIORITY_COLORS[activeThread.priority]}`}>
                        {activeThread.priority}
                      </span>
                      <span className="text-[10px] text-slate-600 capitalize">{activeThread.category}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => fetchMessages(activeThread._id)} className="shrink-0 p-1.5 text-slate-600 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Messages + Events timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                  </div>
                ) : (() => {
                  const timeline: TimelineItem[] = [
                    ...messages.map(m => ({ kind: 'message' as const, data: m })),
                    ...events.map(e => ({ kind: 'event' as const, data: e })),
                  ].sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime())

                  return timeline.map(item => {
                    if (item.kind === 'event') {
                      const ev = item.data
                      const statusLabel = (s: string) => STATUS_LABELS[s]?.label ?? s
                      return (
                        <div key={ev._id} className="flex items-center gap-3 py-1">
                          <div className="flex-1 h-px bg-slate-800" />
                          <span className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            Status changed to{' '}
                            <span className="font-semibold text-slate-300">{statusLabel(ev.newValue || '')}</span>
                            {' '}· {ev.actorName} · {timeAgo(ev.createdAt)}
                          </span>
                          <div className="flex-1 h-px bg-slate-800" />
                        </div>
                      )
                    }
                    const msg = item.data as Message
                    const isStudent = msg.senderType === 'student'
                    return (
                      <div key={msg._id} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] ${isStudent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            isStudent ? 'bg-[#ed143d] text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                          }`}>
                            {msg.body}
                          </div>
                          <div className={`flex items-center gap-1.5 text-[10px] text-slate-600 ${isStudent ? 'flex-row-reverse' : ''}`}>
                            <span className="font-medium">{isStudent ? 'You' : msg.senderName}</span>
                            <span>·</span>
                            <span>{timeAgo(msg.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
                <div ref={msgEndRef} />
              </div>

              {/* Reply box */}
              {activeThread.status !== 'resolved' && activeThread.status !== 'closed' ? (
                <div className="p-4 border-t border-slate-800">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
                      }}
                      placeholder="Type a message… (Enter to send)"
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
                <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>This ticket is <span className="font-semibold capitalize">{activeThread.status}</span>.</span>
                  </div>
                  <button
                    onClick={reopenTicket}
                    disabled={reopening}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 shrink-0"
                  >
                    {reopening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Reopen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
