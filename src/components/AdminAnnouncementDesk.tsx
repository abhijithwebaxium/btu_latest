import React, { useState, useEffect } from 'react'
import {
  Bell, Plus, Trash2, X, Users, Building2, User,
  Clock, AlertTriangle, CheckCircle2, RefreshCw,
} from 'lucide-react'

interface Announcement {
  _id: string
  title: string
  message: string
  targetType: 'all' | 'branch' | 'student'
  targetBranch?: string
  targetStudentId?: string
  priority: 'normal' | 'high' | 'urgent'
  expiresAt: string
  createdAt: string
}

const DURATION_OPTIONS = [
  { label: '1 Hour',   hours: 1   },
  { label: '6 Hours',  hours: 6   },
  { label: '12 Hours', hours: 12  },
  { label: '1 Day',    hours: 24  },
  { label: '3 Days',   hours: 72  },
  { label: '1 Week',   hours: 168 },
  { label: '2 Weeks',  hours: 336 },
  { label: '30 Days',  hours: 720 },
]

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days}d ${hours % 24}h remaining`
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  if (hours > 0) return `${hours}h ${mins}m remaining`
  return `${mins}m remaining`
}

function getAdminKey() {
  return typeof window !== 'undefined' ? localStorage.getItem('admin-key') || '' : ''
}

const priorityBadge = {
  urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  high:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
  normal: 'bg-blue-500/10  text-blue-400  border-blue-500/30',
}
const priorityDot = {
  urgent: 'bg-rose-400',
  high:   'bg-amber-400',
  normal: 'bg-blue-400',
}
const targetIcon = { all: Users, branch: Building2, student: User }

export default function AdminAnnouncementDesk() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading]         = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [errorMsg, setErrorMsg]           = useState<string | null>(null)
  const [successMsg, setSuccessMsg]       = useState<string | null>(null)

  const [title, setTitle]             = useState('')
  const [message, setMessage]         = useState('')
  const [targetType, setTargetType]   = useState<'all' | 'branch' | 'student'>('all')
  const [targetValue, setTargetValue] = useState('')
  const [priority, setPriority]       = useState<'normal' | 'high' | 'urgent'>('normal')
  const [durationHours, setDurationHours] = useState(24)

  const fetchAnnouncements = async () => {
    try {
      const res  = await fetch('/api/announcements?mode=admin', { headers: { 'X-Admin-Key': getAdminKey() } })
      const data = await res.json()
      if (data.success) setAnnouncements(data.announcements)
    } catch { /* silent */ } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const resetForm = () => {
    setTitle(''); setMessage(''); setTargetType('all')
    setTargetValue(''); setPriority('normal'); setDurationHours(24)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true); setErrorMsg(null)
    try {
      const body: Record<string, unknown> = { title, message, targetType, priority, durationHours }
      if (targetType === 'branch')  body.targetBranch    = targetValue
      if (targetType === 'student') body.targetStudentId = targetValue
      const res  = await fetch('/api/announcements', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': getAdminKey() },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg('Announcement posted successfully.')
        resetForm(); setShowForm(false); fetchAnnouncements()
        setTimeout(() => setSuccessMsg(null), 4000)
      } else {
        setErrorMsg(data.error || 'Failed to create announcement.')
      }
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement? Students will no longer see it.')) return
    try {
      const res  = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE', headers: { 'X-Admin-Key': getAdminKey() } })
      const data = await res.json()
      if (data.success) setAnnouncements(prev => prev.filter(a => a._id !== id))
    } catch { /* silent */ }
  }

  const activeCount = announcements.filter(a => new Date(a.expiresAt) > new Date()).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#ed143d]" />
            Announcement Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Post notices to all students, a branch, or a specific student — with a custom visibility window.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {activeCount} Active
            </span>
          )}
          <button
            onClick={() => { setShowForm(p => !p); setErrorMsg(null) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ed143d] hover:bg-rose-700 text-white text-sm font-bold shadow-lg shadow-[#ed143d]/30 transition-all"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Announcement'}
          </button>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />{successMsg}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#ed143d]" />
            Create New Announcement
          </h3>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />{errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Title *</label>
              <input
                required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Exam Hall Change — Semester 4"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ed143d] focus:ring-1 focus:ring-[#ed143d]"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Message *</label>
              <textarea
                required value={message} onChange={e => setMessage(e.target.value)}
                rows={3} placeholder="Write the full announcement text here..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ed143d] focus:ring-1 focus:ring-[#ed143d] resize-none"
              />
            </div>

            {/* Target + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Send To</label>
                <select
                  value={targetType}
                  onChange={e => { setTargetType(e.target.value as 'all' | 'branch' | 'student'); setTargetValue('') }}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#ed143d]"
                >
                  <option value="all">All Students</option>
                  <option value="branch">Specific Branch</option>
                  <option value="student">Specific Student</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Priority</label>
                <select
                  value={priority} onChange={e => setPriority(e.target.value as 'normal' | 'high' | 'urgent')}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#ed143d]"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Conditional target value */}
            {targetType !== 'all' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {targetType === 'branch' ? 'Branch Name *' : 'Student Enrollment ID *'}
                </label>
                <input
                  required value={targetValue} onChange={e => setTargetValue(e.target.value)}
                  placeholder={targetType === 'branch' ? 'e.g. Computer Science and Engineering' : 'e.g. BTU2024CS001'}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ed143d] focus:ring-1 focus:ring-[#ed143d]"
                />
              </div>
            )}

            {/* Duration chips */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Visible For</label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.hours} type="button"
                    onClick={() => setDurationHours(opt.hours)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      durationHours === opt.hours
                        ? 'bg-[#ed143d] border-[#ed143d] text-white shadow-md shadow-[#ed143d]/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ed143d] hover:bg-rose-700 text-white text-sm font-bold shadow-lg shadow-[#ed143d]/30 transition-all disabled:opacity-50">
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Post Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4 text-[#ed143d]" />
            All Announcements
          </h3>
          <span className="text-xs text-slate-400">{announcements.length} total · {activeCount} active</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-[#ed143d]" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 mx-auto mb-3 text-slate-700" />
            <p className="font-semibold text-slate-400 text-sm">No announcements yet</p>
            <p className="text-xs text-slate-600 mt-1">Create one using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {announcements.map(ann => {
              const isActive  = new Date(ann.expiresAt) > new Date()
              const TargetIcon = targetIcon[ann.targetType]
              return (
                <div key={ann._id} className="p-5 hover:bg-slate-800/30 transition-colors flex items-start gap-4">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${priorityDot[ann.priority]}`} />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-sm text-white">{ann.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${priorityBadge[ann.priority]}`}>
                        {ann.priority}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        {isActive ? 'Active' : 'Expired'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-5">{ann.message}</p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <TargetIcon className="w-3 h-3" />
                        {ann.targetType === 'all'     && 'All Students'}
                        {ann.targetType === 'branch'  && `Branch: ${ann.targetBranch}`}
                        {ann.targetType === 'student' && `Student: ${ann.targetStudentId}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isActive
                          ? timeRemaining(ann.expiresAt)
                          : `Expired ${new Date(ann.expiresAt).toLocaleDateString()}`
                        }
                      </span>
                      <span>Posted {new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(ann._id)}
                    className="shrink-0 p-2 rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
