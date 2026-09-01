import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import {
  GraduationCap, LogOut, User, CheckCircle2, FileText,
  Building2, Calendar, Award, Mail, MapPin, Menu,
  ChevronRight, Phone, BadgeCheck, Clock, AlertCircle,
  BarChart3, Shield, TrendingUp, BookOpen, Sun, Moon,
  ArrowUpRight, Layers, Activity, LifeBuoy, ExternalLink,
  ClipboardList, Folder, MessageSquare, Loader2,
} from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import SupportTicketView, { type Thread as SupportThread } from './SupportTicketView'
import { APP_URL } from '../lib/config'

export interface LoggedInStudent {
  _id: string
  enrollmentID?: string
  applicationID?: string
  university?: string
  status?: string
  studyMode?: string
  admissionBatch?: string
  marketingBatch?: string
  isProfileVerified?: boolean
  isFeeCompleted?: boolean
  personalDetails?: {
    name?: string; fatherName?: string; motherName?: string
    dateOfBirth?: string; mobileNumber?: string | number
    whatsAppNumber?: string | number; email?: string; gender?: string
    category?: string; bloodGroup?: string; permanentAddress?: string
    district?: string; state?: string; country?: string
  }
  academicDetails?: {
    nameOfPrograme?: string; branch?: string; parentUniversity?: string
    semesterCompletedAtParentUniversity?: number; academicSession?: string
  }
  course?: { name?: string; shortCode?: string; university?: string }
  branch?: { name?: string; shortCode?: string }
  evaluation?: {
    approvalStage?: number; evaluationStatus?: string
    subjects?: Array<{
      btuSubjectCode?: string; btuSubjectTitle?: string; semester?: number
      equalized?: string; grade?: string; mark?: number | string
      credits?: number; examBatch?: string; examStatus?: string
    }>
  }
  prevUniSubjects?: {
    prevUniSubDetails?: Array<{
      subjectTitle?: string; subjectCode?: string; credits?: number
      grade?: string; mark?: number | string; result?: string; semester?: number
    }>
  }
}

type Tab = 'overview' | 'evaluation' | 'transcripts' | 'classes' | 'assignments' | 'projects' | 'profile' | 'support'

/* ── Status badge (same style as staff badges) ── */
function StatusBadge({ status }: { status?: string }) {
  const s = (status || '').toLowerCase()
  if (!status) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">—</span>
  if (s.includes('approv') || s.includes('complet') || s.includes('pass') || s.includes('equalized'))
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-2.5 h-2.5" />{status}</span>
  if (s.includes('pending') || s.includes('process') || s.includes('review'))
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-2.5 h-2.5" />{status}</span>
  if (s.includes('reject') || s.includes('fail'))
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"><AlertCircle className="w-2.5 h-2.5" />{status}</span>
  return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{status}</span>
}

/* ── KPI card — mirrors staff ModernCard with kpi-card CSS class ── */
function KpiCard({ title, value, sub, icon: Icon, change }: {
  title: string; value: React.ReactNode; sub: string
  icon: React.ElementType; change?: string
}) {
  return (
    <div className="kpi-card group relative cursor-default overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="kpi-glow pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ed143d] opacity-10 blur-2xl" />
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium tracking-wide">{title}</span>
        <div className="kpi-icon rounded-xl bg-slate-800/80 p-3 text-[#ed143d]">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline space-x-3 mb-2">
        <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {change && (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3 mr-1" />{change}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 flex items-center justify-between">
        <span>{sub}</span>
        <ArrowUpRight className="kpi-arrow h-4 w-4 text-slate-500" />
      </p>
    </div>
  )
}

/* ── Profile field with icon ── */
function ProfileField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: React.ReactNode }) {
  return (
    <div className="profile-field group rounded-xl border border-slate-800/80 bg-slate-950/35 p-4 transition-colors hover:border-slate-700 hover:bg-slate-950/55">
      <div className="mb-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#ed143d]/15 bg-[#ed143d]/10">
        <Icon className="h-4 w-4 text-[#ed143d]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="break-words text-sm font-semibold leading-5 text-slate-200">{value || <span className="text-slate-600 font-normal">—</span>}</p>
      </div>
    </div>
  )
}

/* ── Info row (compact key-value) ── */
function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-800/60 py-3.5 last:border-0">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>
      <span className="text-[11px] font-semibold text-slate-200 text-right">{value || <span className="text-slate-600">—</span>}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function StudentDashboard({ student, onSignOut }: { student: LoggedInStudent; onSignOut: () => void }) {
  const [tab, setTab]         = useState<Tab>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme]     = useState<string>('light')
  const [pendingThread, setPendingThread] = useState<SupportThread | null>(null)
  const [chatLoading, setChatLoading]     = useState<string | null>(null) // holds subjectCode of loading card
  const [announcements, setAnnouncements] = useState<Array<{
    _id: string; title: string; message: string
    priority: 'normal' | 'high' | 'urgent'; expiresAt: string
    targetType: string
  }>>([])

  useEffect(() => {
    const branch = student.academicDetails?.branch || ''
    const params = new URLSearchParams({
      studentId: student._id,
      ...(student.enrollmentID  ? { enrollmentID:  student.enrollmentID  } : {}),
      ...(student.applicationID ? { applicationID: student.applicationID } : {}),
      ...(branch                ? { branch }                              : {}),
    })
    fetch(`/api/announcements?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAnnouncements(d.announcements) })
      .catch(() => {})
  }, [student._id, student.enrollmentID, student.applicationID, student.academicDetails?.branch])

  useEffect(() => {
    const saved = localStorage.getItem('university-theme') || 'light'
    setTheme(saved)
    document.documentElement.dataset.theme = saved
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('university-theme', next)
  }

  /* Derived data */
  const p  = student.personalDetails  || {}
  const a  = student.academicDetails  || {}
  const ev = student.evaluation        || {}
  const pr       = student.prevUniSubjects || {}
  const evalSubs = (ev.subjects || []) as Array<Record<string, unknown>>
  const prevSubsRaw = (pr.prevUniSubDetails || []) as Array<{
    subjectTitle?: string; subjectCode?: string; credits?: number
    grade?: string; mark?: number | string; result?: string; semester?: number
  }>
  // Fall back to equalized evaluation subjects when prevUniSubDetails is absent
  const prevSubs = prevSubsRaw.length > 0
    ? prevSubsRaw
    : evalSubs
        .filter(s => s.equalized === 'equalized')
        .map(s => ({
          subjectCode:  (s.btuSubjectCode  || '') as string,
          subjectTitle: (s.btuSubjectTitle || s.equalizedSubject || '') as string,
          semester:     s.semester as number | undefined,
          credits:      s.credits  as number | undefined,
          grade:        s.grade    as string | undefined,
          mark:         s.mark     as number | string | undefined,
          result:       Number(s.mark) >= 40 ? 'Pass' : Number(s.mark) > 0 ? 'Fail' : undefined,
        }))
  const name     = p.name || 'Student'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const program  = a.nameOfPrograme || (student.course as { name?: string })?.name || 'Degree Program'
  const branch   = a.branch         || (student.branch  as { name?: string })?.name || ''
  const sid      = student.enrollmentID || student.applicationID || student._id
  const reappearSubs = evalSubs
    .filter(s => s.equalized === 'reappear' || s.equalized === 're-submission' || s.equalized === 'improvement')
    .map(s => ({
      subjectCode:  (s.btuSubjectCode  || s.subjectCode  || '') as string,
      subjectTitle: (s.btuSubjectTitle || s.subjectTitle || '') as string,
      semester:     s.semester as number | undefined,
      credits:      s.credits  as number | undefined,
      examBatch:    (s.examBatch || s.examBatchSr || '') as string,
      examStatus:   (s.examStatus || '') as string,
      examSession:  (s.examSession || s.examSessionSr || '') as string,
      semesterSet:  (s.semesterSet || '') as string,
      mark:         s.mark     as number | string | undefined,
      grade:        s.grade    as string | undefined,
      equalized:    s.equalized as string,
    }))
  const prevCr   = prevSubs.reduce((s, x) => s + (Number(x.credits) || 0), 0)
  const evalCr   = evalSubs.reduce((s, x) => s + (Number(x.credits) || 0), 0)

  const ASSIGNMENT_DATES: Record<string, string> = {
    'Dec-2024': '30th October 2024', 'June-2025': '30th April 2025',
    'Dec-2025': '30th October 2025', 'June-2026': '30th April 2026',
    'Dec-2026': '30th October 2026', 'June-2027': '30th April 2027',
  }
  const assignmentSubs = reappearSubs.filter(s => s.examStatus === 'A.E.B.T.U.C')
  const projectSubs    = reappearSubs.filter(s => ['M.I.P.R.S', 'M.A.P.R.S.I', 'M.A.P.R.S.II', 'I.R.S'].includes(s.examStatus))
  const projectTypeLabel: Record<string, string> = {
    'M.I.P.R.S': 'Mini Project', 'M.A.P.R.S.I': 'Major Project I',
    'M.A.P.R.S.II': 'Major Project II', 'I.R.S': 'Internship',
  }

  /* Nav groups — mirrors staff structure */
  const navGroups = [
    {
      label: 'Overview',
      items: [{ id: 'overview' as Tab, label: 'Dashboard', icon: BarChart3, badge: null }],
    },
    {
      label: 'Academic Record',
      items: [
        { id: 'evaluation'   as Tab, label: 'Evaluation',  icon: Award,         badge: evalSubs.length || null },
        { id: 'transcripts'  as Tab, label: 'Assessment',  icon: FileText,      badge: prevSubs.length || null },
        { id: 'classes'      as Tab, label: 'Classes',     icon: BookOpen,      badge: reappearSubs.length || null },
        { id: 'assignments'  as Tab, label: 'Assignments', icon: ClipboardList, badge: assignmentSubs.length || null },
        { id: 'projects'     as Tab, label: 'Projects',    icon: Folder,        badge: projectSubs.length || null },
      ],
    },
    {
      label: 'Support',
      items: [{ id: 'support' as Tab, label: 'Support Tickets', icon: LifeBuoy, badge: null }],
    },
    {
      label: 'Account',
      items: [{ id: 'profile' as Tab, label: 'My Profile', icon: User, badge: null }],
    },
  ]

  function navigate(id: Tab) { setTab(id); setMobileOpen(false) }

  async function openChat(cardKey: string, subject: string, body: string) {
    setChatLoading(cardKey)
    try {
      const r = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createThread',
          studentId: student._id,
          studentName: p.name || 'Student',
          subject,
          body,
          category: 'academic',
          priority: 'normal',
        }),
      })
      const d = await r.json()
      if (d.success) {
        setPendingThread(d.thread)
        setTab('support')
        setMobileOpen(false)
      }
    } catch { /* silent */ } finally {
      setChatLoading(null)
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-[#ed143d] selection:text-white antialiased">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─────────────── SIDEBAR ─────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between backdrop-blur-2xl overflow-y-auto transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        <div>
          {/* Logo — identical to staff */}
          <div className="p-6 flex items-center space-x-3 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ed143d] to-rose-500 flex items-center justify-center shadow-lg shadow-[#ed143d]/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-[14px] text-white tracking-wide flex items-center">
                BTU <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-[#ed143d]/20 text-[#ed143d] border border-[#ed143d]/30 font-mono">Student</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Bir Tikendrajit University</p>
            </div>
          </div>

          {/* Nav groups */}
          <nav className="p-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-4 mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map(({ id, label, icon: Icon, badge }) => {
                    const active = tab === id
                    return (
                      <button
                        key={id}
                        onClick={() => navigate(id)}
                        className={`sidebar-nav-item relative w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
                          active ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="studentActiveTab"
                            className="absolute inset-0 bg-gradient-to-r from-[#ed143d] to-rose-600 rounded-xl shadow-lg shadow-[#ed143d]/30"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <div className="relative z-10 flex items-center space-x-3">
                          <Icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                          <span className="sidebar-nav-label">{label}</span>
                        </div>
                        {badge !== null && badge !== undefined && (
                          <span className={`relative z-10 text-xs px-2 py-0.5 rounded-full font-bold ${
                            active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                          }`}>
                            {badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Student identity card — mirrors staff user card */}
        <div className="p-4 border-t border-slate-800/80 m-3 rounded-2xl bg-slate-950/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ed143d] to-rose-700 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{sid}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[#ed143d]/10 hover:text-[#ed143d] shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          {student.isProfileVerified && (
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Profile Verified</span>
            </div>
          )}
        </div>
      </aside>

      {/* ─────────────── MAIN ─────────────── */}
      <main className="h-screen overflow-y-auto bg-slate-950 lg:ml-[260px]">

        {/* Navbar — same structure as staff */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label="Toggle navigation"
              className="lg:hidden shrink-0 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <GraduationCap className="w-4 h-4 text-[#ed143d]" />
              <span className="hidden sm:inline">Student Portal</span>
              <ChevronRight className="w-3 h-3 hidden sm:inline" />
              <span className="font-semibold text-white">
                {navGroups.flatMap(g => g.items).find(i => i.id === tab)?.label}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center space-x-2 sm:space-x-3">
            {/* Batch badge */}
            {student.admissionBatch && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-[#ed143d]" />
                <span>Batch <strong className="text-white">{student.admissionBatch}</strong></span>
              </div>
            )}

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="hidden sm:flex p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <NotificationCenter
              studentId={student._id}
              recipientType="STUDENT"
            />

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ed143d] to-rose-700 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
              {initials}
            </div>
          </div>
        </header>

        {/* ─── Page content ─── */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 w-full">

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Page header */}
              <div className="flex flex-col gap-5 py-2 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
                    Welcome back, {name.split(' ')[0]} 👋
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {program}{branch ? ` · ${branch}` : ''} — Bir Tikendrajit University Credit Transfer
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    {student.studyMode || 'Credit Transfer'}
                  </span>
                  <span className="rounded-full border border-[#ed143d]/30 bg-[#ed143d]/10 px-3 py-1 text-xs font-semibold text-[#ed143d]">
                    {ev.evaluationStatus || 'Pending Evaluation'}
                  </span>
                </div>
              </div>

              {/* Announcements */}
              {announcements.length > 0 && (
                <div className="space-y-3">
                  {announcements.map(ann => {
                    const urgentStyle  = 'bg-rose-500/10  border-rose-500/30  text-rose-300'
                    const highStyle    = 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    const normalStyle  = 'bg-blue-500/10  border-blue-500/30  text-blue-300'
                    const dotStyle     = ann.priority === 'urgent' ? 'bg-rose-400' : ann.priority === 'high' ? 'bg-amber-400' : 'bg-blue-400'
                    const cardStyle    = ann.priority === 'urgent' ? urgentStyle  : ann.priority === 'high'  ? highStyle    : normalStyle
                    const timeLeft = (() => {
                      const diff = new Date(ann.expiresAt).getTime() - Date.now()
                      if (diff <= 0) return ''
                      const h = Math.floor(diff / 3_600_000)
                      const d = Math.floor(h / 24)
                      return d > 0 ? `${d}d left` : `${h}h left`
                    })()
                    return (
                      <div key={ann._id} className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${cardStyle}`}>
                        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotStyle}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-white">{ann.title}</p>
                            {ann.priority !== 'normal' && (
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{ann.priority}</span>
                            )}
                          </div>
                          <p className="text-xs mt-1 leading-5 opacity-80">{ann.message}</p>
                        </div>
                        {timeLeft && <span className="text-[10px] font-semibold opacity-50 shrink-0 mt-0.5">{timeLeft}</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <KpiCard title="EVALUATION STATUS" value={ev.evaluationStatus || 'Pending'} sub={`Stage ${ev.approvalStage ?? 0} Approval`} icon={Activity} />
                <KpiCard title="BTU SUBJECTS"      value={evalSubs.length}                  sub="Equalized Courses"                          icon={Award}    change={evalSubs.length > 0 ? 'Mapped' : undefined} />
                <KpiCard title="TRANSFER CREDITS"  value={prevCr}                           sub={`${prevSubs.length} Subjects Submitted`}    icon={BarChart3} />
                <KpiCard title="EVAL CREDITS"      value={evalCr}                           sub="BTU Credit Mapping"                         icon={TrendingUp} change={evalCr > 0 ? 'Credited' : undefined} />
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Student overview card */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-xl lg:col-span-2">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#ed143d]/5 blur-3xl" />
                  <div className="relative flex flex-col gap-3 border-b border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ed143d]/20 bg-[#ed143d]/10"><BookOpen className="h-5 w-5 text-[#ed143d]" /></div>
                      <div><h3 className="text-lg font-bold text-white">Academic Profile</h3><p className="mt-0.5 text-xs text-slate-400">Current academic standing and university mapping details</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.isProfileVerified && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                          <BadgeCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                        {[
                          { label: 'Enrollment ID', icon: User, value: <span className="font-mono text-[#ed143d] font-bold">{sid}</span> },
                          { label: 'Programme', icon: GraduationCap, value: program },
                          { label: 'Branch', icon: Layers, value: branch || '—' },
                          { label: 'Parent University', icon: Building2, value: a.parentUniversity || '—' },
                          { label: 'Academic Session', icon: Calendar, value: a.academicSession || '—' },
                          { label: 'Admission Batch', icon: Calendar, value: student.admissionBatch || '—' },
                          { label: 'Study Mode', icon: FileText, value: <span className="font-mono text-amber-400">{student.studyMode || 'Credit Transfer'}</span> },
                          { label: 'Profile Status', icon: Shield, value: student.isProfileVerified
                              ? <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Verified</span>
                              : <span className="inline-flex items-center gap-1 text-amber-400 font-semibold"><Clock className="w-3.5 h-3.5" />Pending</span>
                          },
                        ].map(({ label, icon: Icon, value }) => (
                          <div key={label} className="group flex min-w-0 items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-500 transition-colors group-hover:bg-[#ed143d]/10 group-hover:text-[#ed143d]"><Icon className="h-4 w-4" /></div>
                            <div className="min-w-0"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p><div className="break-words text-sm font-semibold leading-5 text-slate-200">{value}</div></div>
                          </div>
                        ))}
                  </div>
                </div>

                {/* Stats summary card */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-[#ed143d]" />
                      <span>Credit Summary</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">Your academic credit transfer progress</p>

                    <div className="space-y-5">
                      {[
                        { label: 'BTU Evaluation', count: evalSubs.length, total: Math.max(evalSubs.length, prevSubs.length, 1), color: '#ed143d', sub: `${evalCr} credits mapped` },
                        { label: 'Credit Transfers', count: prevSubs.length, total: Math.max(prevSubs.length, 1), color: '#f59e0b', sub: `${prevCr} credits submitted` },
                        { label: 'Semesters Completed', count: a.semesterCompletedAtParentUniversity || 0, total: 8, color: '#10b981', sub: 'at parent university' },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs font-medium text-slate-400 mb-1.5">
                            <span className="text-slate-300">{item.label}</span>
                            <span className="text-white font-bold">{item.count}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${Math.min((item.count / item.total) * 100, 100)}%`, backgroundColor: item.color }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1">{item.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-slate-500" />Status</span>
                      <StatusBadge status={student.status || 'Active'} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-500" />Fee</span>
                      {student.isFeeCompleted
                        ? <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Completed</span>
                        : <span className="text-amber-400 font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Pending</span>
                      }
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ══ BTU EVALUATION ══ */}
          {tab === 'evaluation' && (
            <motion.div
              key="evaluation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">BTU Evaluation</h2>
                  <p className="text-slate-400 text-sm">Subject equalization and credit mapping at Bir Tikendrajit University.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={ev.evaluationStatus} />
                  <a
                    href={`${APP_URL}/report`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ed143d] hover:bg-rose-700 text-white text-xs font-semibold shadow-lg shadow-[#ed143d]/30 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Credit Evaluation Report
                  </a>
                </div>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: 'Total Subjects', value: evalSubs.length, icon: BookOpen, color: 'text-[#ed143d]', glow: 'bg-[#ed143d]', note: 'Subjects evaluated' },
                  { label: 'Total Credits', value: evalCr, icon: Award, color: 'text-emerald-400', glow: 'bg-emerald-500', note: 'Credits mapped at BTU' },
                  { label: 'Approval Stage', value: `Stage ${ev.approvalStage ?? 0}`, icon: Shield, color: 'text-amber-400', glow: 'bg-amber-500', note: 'Current review progress' },
                ].map(({ label, value, icon: Icon, color, glow, note }) => (
                  <div key={label} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl transition-all hover:-translate-y-0.5 hover:border-slate-700">
                    <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${glow} opacity-[0.08] blur-2xl group-hover:opacity-[0.14]`} />
                    <div className="relative mb-3 flex items-start justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800/80"><Icon className={`h-4 w-4 ${color}`} /></div><ArrowUpRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400" /></div>
                    <p className={`relative text-2xl font-extrabold tracking-tight ${color}`}>{value}</p>
                    <p className="relative mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                    <p className="relative mt-1 text-[10px] text-slate-600">{note}</p>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 p-6">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Award className="w-5 h-5 text-[#ed143d]" />
                    <span>Subject Mapping & Equalization</span>
                  </h3>
                  <span className="text-xs text-slate-400">{evalSubs.length} subjects</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse text-left table-fixed">
                    <colgroup>
                      <col className="w-[16%]" />
                      <col className="w-[34%]" />
                      <col className="w-[8%]" />
                      <col className="w-[10%]" />
                      <col className="w-[12%]" />
                      <col className="w-[20%]" />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-950/50 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-6 py-3.5">Subject Code</th>
                        <th className="px-4 py-3.5">BTU Subject Title</th>
                        <th className="px-4 py-3.5">Sem</th>
                        <th className="px-4 py-3.5">Credits</th>
                        <th className="px-4 py-3.5">Grade / Mark</th>
                        <th className="px-6 py-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {evalSubs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <Award className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                            <p className="text-sm text-slate-500">No evaluated subjects available yet.</p>
                          </td>
                        </tr>
                      ) : evalSubs.map((sub, i) => {
                        const s = sub as Record<string, unknown>
                        const BTU_CODE_RE = /^([A-Z]{2,6}\d{2,5}[A-Z]?)\s*-\s*(.+)$/
                        const eqRaw = (s.equalizedSubject || '') as string
                        const eqMatch = eqRaw ? eqRaw.match(BTU_CODE_RE) : null
                        const isReappear = s.equalized !== 'equalized'
                        const code  = (s.btuSubjectCode  || (eqMatch ? eqMatch[1] : '')) as string
                        const title = (s.btuSubjectTitle || (eqMatch ? eqMatch[2] : ''))  as string
                        const examBatch  = (s.examBatch  || '') as string
                        const examStatus = (s.examStatus || '') as string
                        return (
                          <tr key={i} className="group transition-colors hover:bg-slate-800/40">
                            <td className="px-6 py-4">
                              {code ? (
                                <span className="block truncate text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-[#ed143d] border border-slate-700" title={code}>
                                  {code}
                                </span>
                              ) : isReappear && examBatch ? (
                                <span className="block truncate text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" title={examBatch}>
                                  {examBatch}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {title ? (
                                <span className="block truncate text-sm font-semibold text-white" title={title}>{title}</span>
                              ) : isReappear ? (
                                <div>
                                  <span className="text-sm font-semibold text-amber-400">Reappear Exam</span>
                                  {examStatus && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{examStatus}</p>}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm font-mono text-slate-300">{(s.semester as number) ?? '—'}</td>
                            <td className="px-4 py-4 text-sm font-bold text-slate-200">{(s.credits as number) ?? '—'}</td>
                            <td className="px-4 py-4 text-sm font-bold text-emerald-400">{(s.grade || s.mark || '—') as string}</td>
                            <td className="px-6 py-4 text-right">
                              <StatusBadge status={(s.equalized || s.examStatus) as string | undefined} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ CREDIT TRANSFERS ══ */}
          {tab === 'transcripts' && (
            <motion.div
              key="transcripts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white">Credit Transfers</h2>
                <p className="text-slate-400 text-sm">
                  Academic record from {a.parentUniversity || 'previous university'} — submitted for BTU credit mapping.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Transfer Subjects', value: prevSubs.length, icon: FileText, color: 'text-[#ed143d]', glow: 'bg-[#ed143d]', note: 'Submitted for transfer' },
                  { label: 'Transfer Credits', value: prevCr, icon: Award, color: 'text-amber-400', glow: 'bg-amber-500', note: 'Credits submitted' },
                  { label: 'Reappear Subjects', value: reappearSubs.length, icon: Activity, color: 'text-orange-400', glow: 'bg-orange-500', note: 'Awaiting examination' },
                  { label: 'Semesters', value: a.semesterCompletedAtParentUniversity ? `${a.semesterCompletedAtParentUniversity} Sem` : '—', icon: Layers, color: 'text-blue-400', glow: 'bg-blue-500', note: 'At parent university' },
                ].map(({ label, value, icon: Icon, color, glow, note }) => (
                  <div key={label} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl transition-all hover:-translate-y-0.5 hover:border-slate-700">
                    <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${glow} opacity-[0.08] blur-2xl group-hover:opacity-[0.14]`} />
                    <div className="relative mb-3 flex items-start justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800/80"><Icon className={`h-4 w-4 ${color}`} /></div><ArrowUpRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400" /></div>
                    <p className={`relative text-2xl font-extrabold tracking-tight ${color}`}>{value}</p>
                    <p className="relative mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                    <p className="relative mt-1 text-[10px] text-slate-600">{note}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 p-6">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-[#ed143d]" />
                    <span>Transfer Subjects — {a.parentUniversity || 'Parent University'}</span>
                  </h3>
                  <span className="text-xs text-slate-400">{prevSubs.length} subjects · {prevCr} credits</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-950/50 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-6 py-3.5">Subject Code</th>
                        <th className="px-4 py-3.5">Subject Title</th>
                        <th className="px-4 py-3.5">Sem</th>
                        <th className="px-4 py-3.5">Credits</th>
                        <th className="px-4 py-3.5">Mark / Grade</th>
                        <th className="px-6 py-3.5 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {prevSubs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <FileText className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                            <p className="text-sm text-slate-500">No credit transfer subjects listed.</p>
                          </td>
                        </tr>
                      ) : prevSubs.map((sub, i) => (
                        <tr key={i} className="group transition-colors hover:bg-slate-800/40">
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                              {sub.subjectCode || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-white">{sub.subjectTitle || '—'}</span>
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-slate-300">{sub.semester ?? '—'}</td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-200">{sub.credits ?? '—'}</td>
                          <td className="px-4 py-4 text-sm font-bold text-emerald-400">{sub.grade || sub.mark || '—'}</td>
                          <td className="px-6 py-4 text-right"><StatusBadge status={sub.result} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Reappear / Re-submission Subjects ── */}
              <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-slate-900/80 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-orange-500/20 p-6">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-orange-400" />
                    <span>Reappear / Re-submission Subjects</span>
                  </h3>
                  <span className="text-xs text-slate-400">{reappearSubs.length} subject{reappearSubs.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-950/50 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-6 py-3.5">Subject Code</th>
                        <th className="px-4 py-3.5">Subject Title</th>
                        <th className="px-4 py-3.5">Sem</th>
                        <th className="px-4 py-3.5">Credits</th>
                        <th className="px-4 py-3.5">Exam Batch</th>
                        <th className="px-4 py-3.5">Exam Status</th>
                        <th className="px-6 py-3.5 text-right">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {reappearSubs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <FileText className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                            <p className="text-sm text-slate-500">No reappear subjects listed.</p>
                          </td>
                        </tr>
                      ) : reappearSubs.map((sub, i) => (
                        <tr key={i} className="group transition-colors hover:bg-slate-800/40">
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-orange-400 border border-slate-700">
                              {sub.subjectCode || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-white">{sub.subjectTitle || '—'}</span>
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-slate-300">{sub.semester ?? '—'}</td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-200">{sub.credits ?? '—'}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{sub.examBatch || sub.semesterSet || '—'}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{sub.examStatus || '—'}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              sub.equalized === 'improvement'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : sub.equalized === 're-submission'
                                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                              {sub.equalized === 'improvement' ? 'Improvement' : sub.equalized === 're-submission' ? 'Re-submission' : 'Reappear'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ CLASSES ══ */}
          {tab === 'classes' && (
            <motion.div
              key="classes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white">My Classes</h2>
                <p className="text-slate-400 text-sm">
                  BTU subjects you are currently enrolled in — grouped by semester.
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Subjects',  value: reappearSubs.length,                                                   color: 'text-white' },
                  { label: 'Total Credits',   value: reappearSubs.reduce((s, x) => s + (Number(x.credits) || 0), 0),        color: 'text-[#ed143d]' },
                  { label: 'Semesters',       value: [...new Set(reappearSubs.map(s => s.semester).filter(Boolean))].length, color: 'text-blue-400' },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center shadow-xl">
                    <p className={`text-2xl font-extrabold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">{c.label}</p>
                  </div>
                ))}
              </div>

              {reappearSubs.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  <p className="text-sm text-slate-500">No class subjects found. Your evaluation may still be pending.</p>
                </div>
              ) : (
                /* Group by semester */
                Object.entries(
                  reappearSubs.reduce<Record<number, typeof reappearSubs>>((acc, s) => {
                    const sem = s.semester ?? 0
                    ;(acc[sem] = acc[sem] || []).push(s)
                    return acc
                  }, {})
                )
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([sem, subs]) => (
                    <div key={sem} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
                      {/* Semester header */}
                      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-[#ed143d]/10 text-[#ed143d] font-black text-sm flex items-center justify-center border border-[#ed143d]/20">
                            {Number(sem) || '?'}
                          </span>
                          <h3 className="text-sm font-bold text-white">
                            {Number(sem) ? `Semester ${sem}` : 'Unassigned'}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                          {subs.length} subject{subs.length !== 1 ? 's' : ''} · {subs.reduce((s, x) => s + (Number(x.credits) || 0), 0)} credits
                        </span>
                      </div>

                      {/* Subject cards grid */}
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {subs.map((sub, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-800/60 transition-all"
                          >
                            {/* Code badge + credits */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#ed143d]/10 text-[#ed143d] border border-[#ed143d]/20">
                                {sub.subjectCode || 'N/A'}
                              </span>
                              {sub.credits && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 shrink-0">
                                  {sub.credits} CR
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <p className="text-sm font-semibold text-white leading-snug mb-3">
                              {sub.subjectTitle || '—'}
                            </p>

                            {/* Exam batch / session */}
                            <div className="space-y-1">
                              {sub.examBatch && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <Calendar className="w-3 h-3 shrink-0 text-slate-600" />
                                  <span>Exam: <span className="text-slate-300 font-medium">{sub.examBatch}</span></span>
                                </div>
                              )}
                              {sub.examSession && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <Clock className="w-3 h-3 shrink-0 text-slate-600" />
                                  <span className="truncate">{sub.examSession}</span>
                                </div>
                              )}
                              {sub.examStatus && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                                    {sub.examStatus}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </motion.div>
          )}

          {/* ══ ASSIGNMENTS ══ */}
          {tab === 'assignments' && (
            <motion.div
              key="assignments"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white">Assignments</h2>
                <p className="text-slate-400 text-sm">
                  Theory subjects requiring reappear examination — grouped by semester.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Subjects', value: assignmentSubs.length,                                                    color: 'text-white' },
                  { label: 'Total Credits',  value: assignmentSubs.reduce((s, x) => s + (Number(x.credits) || 0), 0),         color: 'text-[#ed143d]' },
                  { label: 'Semesters',      value: [...new Set(assignmentSubs.map(s => s.semester).filter(Boolean))].length,  color: 'text-blue-400' },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center shadow-xl">
                    <p className={`text-2xl font-extrabold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">{c.label}</p>
                  </div>
                ))}
              </div>

              {assignmentSubs.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  <p className="text-sm text-slate-500">No assignment subjects found. Your evaluation may still be pending.</p>
                </div>
              ) : (
                Object.entries(
                  assignmentSubs.reduce<Record<number, typeof assignmentSubs>>((acc, s) => {
                    const sem = s.semester ?? 0
                    ;(acc[sem] = acc[sem] || []).push(s)
                    return acc
                  }, {})
                )
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([sem, subs]) => (
                    <div key={sem} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-[#ed143d]/10 text-[#ed143d] font-black text-sm flex items-center justify-center border border-[#ed143d]/20">
                            {Number(sem) || '?'}
                          </span>
                          <h3 className="text-sm font-bold text-white">
                            {Number(sem) ? `Semester ${sem}` : 'Unassigned'}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                          {subs.length} subject{subs.length !== 1 ? 's' : ''} · {subs.reduce((s, x) => s + (Number(x.credits) || 0), 0)} credits
                        </span>
                      </div>

                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {subs.map((sub, i) => {
                          const deadline = ASSIGNMENT_DATES[sub.examBatch] || ASSIGNMENT_DATES[sub.examSession] || null
                          const cardKey = `a-${sub.subjectCode}-${i}`
                          const isCreating = chatLoading === cardKey
                          return (
                            <div
                              key={i}
                              className="rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-800/60 transition-all flex flex-col"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#ed143d]/10 text-[#ed143d] border border-[#ed143d]/20">
                                  {sub.subjectCode || 'N/A'}
                                </span>
                                {sub.credits && (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 shrink-0">
                                    {sub.credits} CR
                                  </span>
                                )}
                              </div>

                              <p className="text-sm font-semibold text-white leading-snug mb-3">
                                {sub.subjectTitle || '—'}
                              </p>

                              <div className="space-y-1 flex-1">
                                {sub.examBatch && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                    <Calendar className="w-3 h-3 shrink-0 text-slate-600" />
                                    <span>Exam: <span className="text-slate-300 font-medium">{sub.examBatch}</span></span>
                                  </div>
                                )}
                                {deadline && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400 mt-1">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>Submit by: <span className="font-semibold">{deadline}</span></span>
                                  </div>
                                )}
                                <div className="mt-1.5">
                                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    sub.equalized === 'improvement'
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                      : sub.equalized === 're-submission'
                                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                  }`}>
                                    {sub.equalized === 'improvement' ? 'Improvement' : sub.equalized === 're-submission' ? 'Re-submission' : 'Reappear'}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => openChat(
                                  cardKey,
                                  `Assignment Query: ${sub.subjectTitle || sub.subjectCode || 'Subject'}`,
                                  `I need assistance with my reappear assignment for:\n\nSubject: ${sub.subjectTitle || '—'}\nCode: ${sub.subjectCode || '—'}\nSemester: ${sub.semester ?? '—'}\nExam Batch: ${sub.examBatch || '—'}${deadline ? `\nSubmission Deadline: ${deadline}` : ''}\n\nPlease guide me on the next steps.`,
                                )}
                                disabled={isCreating}
                                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-[#ed143d]/10 hover:border-[#ed143d]/30 border border-slate-700 text-slate-300 hover:text-[#ed143d] text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isCreating
                                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Opening…</>
                                  : <><MessageSquare className="w-3.5 h-3.5" /> Chat</>
                                }
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
              )}
            </motion.div>
          )}

          {/* ══ PROJECTS ══ */}
          {tab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white">Projects</h2>
                <p className="text-slate-400 text-sm">
                  Project and internship subjects requiring reappear or re-submission — grouped by semester.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Projects', value: projectSubs.length,                                                    color: 'text-white' },
                  { label: 'Total Credits',  value: projectSubs.reduce((s, x) => s + (Number(x.credits) || 0), 0),         color: 'text-[#ed143d]' },
                  { label: 'Semesters',      value: [...new Set(projectSubs.map(s => s.semester).filter(Boolean))].length,  color: 'text-blue-400' },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center shadow-xl">
                    <p className={`text-2xl font-extrabold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">{c.label}</p>
                  </div>
                ))}
              </div>

              {projectSubs.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
                  <Folder className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  <p className="text-sm text-slate-500">No project subjects found. Your evaluation may still be pending.</p>
                </div>
              ) : (
                Object.entries(
                  projectSubs.reduce<Record<number, typeof projectSubs>>((acc, s) => {
                    const sem = s.semester ?? 0
                    ;(acc[sem] = acc[sem] || []).push(s)
                    return acc
                  }, {})
                )
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([sem, subs]) => (
                    <div key={sem} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-[#ed143d]/10 text-[#ed143d] font-black text-sm flex items-center justify-center border border-[#ed143d]/20">
                            {Number(sem) || '?'}
                          </span>
                          <h3 className="text-sm font-bold text-white">
                            {Number(sem) ? `Semester ${sem}` : 'Unassigned'}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                          {subs.length} project{subs.length !== 1 ? 's' : ''} · {subs.reduce((s, x) => s + (Number(x.credits) || 0), 0)} credits
                        </span>
                      </div>

                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {subs.map((sub, i) => {
                          const typeLabel = projectTypeLabel[sub.examStatus] || sub.examStatus
                          const typeColor = sub.examStatus === 'I.R.S'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : sub.examStatus === 'M.I.P.R.S'
                              ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          const cardKey = `p-${sub.subjectCode}-${i}`
                          const isCreating = chatLoading === cardKey
                          return (
                            <div
                              key={i}
                              className="rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-800/60 transition-all flex flex-col"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${typeColor}`}>
                                  {typeLabel}
                                </span>
                                {sub.credits && (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 shrink-0">
                                    {sub.credits} CR
                                  </span>
                                )}
                              </div>

                              <p className="text-sm font-semibold text-white leading-snug mb-3">
                                {sub.subjectTitle || '—'}
                              </p>

                              {sub.subjectCode && (
                                <div className="mb-2">
                                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    {sub.subjectCode}
                                  </span>
                                </div>
                              )}

                              <div className="space-y-1 flex-1">
                                {sub.examBatch && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                    <Calendar className="w-3 h-3 shrink-0 text-slate-600" />
                                    <span>Exam: <span className="text-slate-300 font-medium">{sub.examBatch}</span></span>
                                  </div>
                                )}
                                {sub.examSession && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                    <Clock className="w-3 h-3 shrink-0 text-slate-600" />
                                    <span className="truncate">{sub.examSession}</span>
                                  </div>
                                )}
                                <div className="mt-1.5">
                                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    sub.equalized === 'improvement'
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                      : sub.equalized === 're-submission'
                                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                  }`}>
                                    {sub.equalized === 'improvement' ? 'Improvement' : sub.equalized === 're-submission' ? 'Re-submission' : 'Reappear'}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => openChat(
                                  cardKey,
                                  `${typeLabel} Query: ${sub.subjectTitle || sub.subjectCode || 'Project'}`,
                                  `I need assistance with my ${typeLabel.toLowerCase()} re-submission:\n\nSubject: ${sub.subjectTitle || '—'}\nCode: ${sub.subjectCode || '—'}\nType: ${typeLabel}\nSemester: ${sub.semester ?? '—'}\nExam Batch: ${sub.examBatch || '—'}\n\nPlease guide me on the next steps.`,
                                )}
                                disabled={isCreating}
                                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-[#ed143d]/10 hover:border-[#ed143d]/30 border border-slate-700 text-slate-300 hover:text-[#ed143d] text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isCreating
                                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Opening…</>
                                  : <><MessageSquare className="w-3.5 h-3.5" /> Chat</>
                                }
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
              )}
            </motion.div>
          )}

          {/* ══ SUPPORT ══ */}
          {tab === 'support' && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SupportTicketView
                studentId={student._id}
                studentName={p.name || 'Student'}
                initialThread={pendingThread}
              />
            </motion.div>
          )}

          {/* ══ PROFILE ══ */}
          {tab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="student-profile mx-auto max-w-[1500px] space-y-7"
            >
              {/* ── Hero banner ── */}
              <div className="profile-hero relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 shadow-2xl shadow-black/20">
                {/* Background glows */}
                <div className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[#ed143d]/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-12 bottom-0 w-52 h-52 rounded-full bg-rose-900/10 blur-3xl" />

                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ed143d] via-rose-400 to-transparent" />
                <div className="relative p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 rounded-3xl bg-[#ed143d]/40 blur-xl scale-110 pointer-events-none" />
                      <div className="relative flex h-28 w-28 select-none items-center justify-center rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#ed143d] to-rose-800 text-4xl font-black text-white shadow-2xl shadow-[#ed143d]/30">
                        {initials}
                      </div>
                      {student.isProfileVerified && (
                        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-[3px] border-slate-900 flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Name & chips */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-[#ed143d] border border-slate-700 tracking-wider">
                          {sid}
                        </span>
                        {student.isProfileVerified
                          ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold"><BadgeCheck className="w-2.5 h-2.5" />Verified</span>
                          : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold"><Clock className="w-2.5 h-2.5" />Pending Verification</span>
                        }
                      </div>
                      <h2 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">{name}</h2>
                      <p className="text-slate-400 mt-1 text-sm">{program}{branch ? ` · ${branch}` : ''}</p>

                      {/* Stat strip */}
                      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-6 md:grid-cols-4">
                        {[
                          { icon: Building2, label: 'University', value: 'BTU' },
                          { icon: Calendar,  label: 'Batch',      value: student.admissionBatch || '—' },
                          { icon: Layers,    label: 'Mode',       value: student.studyMode || 'Credit Transfer' },
                          { icon: Shield,    label: 'Status',     value: student.status || 'Active' },
                        ].map(({ icon: Icon, label, value: val }) => (
                          <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-slate-500">
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                            </div>
                            <p className="truncate text-xs font-semibold text-slate-200">{val}</p>
                          </div>
                        ))}
                        <div className="col-span-2 flex items-center gap-1.5 md:col-span-4">
                          {student.isFeeCompleted
                            ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />Fee Cleared</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400"><Clock className="w-3.5 h-3.5" />Fee Pending</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 3-column grid ── */}
              <div className="grid grid-cols-1 gap-7 xl:grid-cols-3">

                {/* Left 2 columns — details */}
                <div className="space-y-7 xl:col-span-2">

                  {/* Personal details */}
                  <div className="profile-panel overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
                      <div className="rounded-lg bg-[#ed143d]/10 p-2"><User className="h-4 w-4 text-[#ed143d]" /></div>
                      <div><p className="text-sm font-bold text-white">Personal Details</p><p className="mt-0.5 text-xs text-slate-500">Your personal and family information</p></div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="contents">
                        <ProfileField icon={User}     label="Full Name"      value={p.name} />
                        <ProfileField icon={User}     label="Father's Name"  value={p.fatherName} />
                        <ProfileField icon={User}     label="Mother's Name"  value={p.motherName} />
                        <ProfileField icon={Calendar} label="Date of Birth"  value={p.dateOfBirth} />
                      </div>
                      <div className="contents">
                        <ProfileField icon={User}    label="Gender"       value={p.gender} />
                        <ProfileField icon={Layers}  label="Category"     value={p.category} />
                        <ProfileField icon={Activity} label="Blood Group" value={
                          p.bloodGroup
                            ? <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs">{p.bloodGroup}</span>
                            : undefined
                        } />
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="profile-panel overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
                      <div className="rounded-lg bg-[#ed143d]/10 p-2"><Phone className="h-4 w-4 text-[#ed143d]" /></div>
                      <div><p className="text-sm font-bold text-white">Contact Information</p><p className="mt-0.5 text-xs text-slate-500">Ways the university can reach you</p></div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
                      <ProfileField icon={Mail}  label="Email Address"   value={p.email} />
                      <ProfileField icon={Phone} label="Mobile Number"   value={p.mobileNumber?.toString()} />
                      <ProfileField icon={Phone} label="WhatsApp Number" value={p.whatsAppNumber?.toString()} />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="profile-panel overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
                      <div className="rounded-lg bg-[#ed143d]/10 p-2"><MapPin className="h-4 w-4 text-[#ed143d]" /></div>
                      <div><p className="text-sm font-bold text-white">Address</p><p className="mt-0.5 text-xs text-slate-500">Permanent residential details</p></div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
                      {[
                        { label: 'Permanent Address', value: p.permanentAddress, span: 'sm:col-span-3' },
                        { label: 'District',          value: p.district,         span: '' },
                        { label: 'State',             value: p.state,            span: '' },
                        { label: 'Country',           value: p.country,          span: '' },
                      ].map(item => (
                        <div key={item.label} className={`profile-field rounded-xl border border-slate-800/80 bg-slate-950/35 p-4 ${item.span}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{item.label}</p>
                          <p className="break-words text-sm font-semibold leading-6 text-slate-200">{item.value || <span className="text-slate-600 font-normal">—</span>}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column — ID card + academic snapshot */}
                <div className="space-y-5">

                  {/* Student ID card visual */}
                  <div className={`student-id-card overflow-hidden rounded-3xl border shadow-2xl ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'}`}>
                    {/* Card header stripe */}
                    <div className="student-id-card-header relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-[#ed143d] to-rose-600 px-5 py-3.5">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      <div className="relative flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-white" />
                        <span className="text-white font-black text-sm tracking-widest">BTU</span>
                      </div>
                      <span className="relative text-white/80 text-[10px] font-bold uppercase tracking-widest">Student ID</span>
                    </div>

                    {/* Card body */}
                    <div className="p-5 space-y-4">
                      {/* Avatar + name */}
                      <div className="flex items-start gap-3.5">
                        <div className="student-id-avatar flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#ed143d]/25 bg-gradient-to-br from-[#ed143d]/20 to-rose-900/30 text-2xl font-black text-[#ed143d] shadow-inner">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-sm leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{name}</p>
                          <p className={`text-[10px] mt-0.5 truncate ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{program}</p>
                          {branch && <p className={`text-[10px] truncate ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>{branch}</p>}
                        </div>
                      </div>

                      {/* Key-value grid */}
                      <div className="space-y-2 text-[11px] pt-1">
                        {[
                          { key: 'ID Number',    val: sid,                                                        mono: true,  accent: true  },
                          { key: 'Batch',        val: student.admissionBatch || '—',                              mono: false, accent: false },
                          { key: 'University',   val: 'Bir Tikendrajit Uni.',                                     mono: false, accent: false },
                          { key: 'Verification', val: student.isProfileVerified ? 'Verified ✓' : 'Pending',      mono: false, accent: false, green: student.isProfileVerified },
                        ].map(({ key, val, mono, accent, green }) => (
                          <div key={key} className={`flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 ${theme === 'light' ? 'border-slate-100' : 'border-slate-800/60'}`}>
                            <span className={theme === 'light' ? 'text-slate-400' : 'text-slate-500'}>{key}</span>
                            <span className={`font-semibold ${mono ? 'font-mono' : ''} ${accent ? 'text-[#ed143d]' : green ? 'text-emerald-500' : theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Decorative barcode */}
                      <div className={`student-id-barcode border-t pt-3 ${theme === 'light' ? 'border-slate-100' : 'border-slate-700/60'}`}>
                        <div className="flex items-end gap-px h-7">
                          {Array.from({ length: 42 }).map((_, i) => {
                            const code = sid.charCodeAt(i % sid.length) || 65
                            const h = ((code * (i + 1) * 7) % 60) + 40
                            return (
                              <div
                                key={i}
                                className={`flex-1 rounded-[1px] ${theme === 'light' ? 'bg-slate-400' : 'bg-slate-500'}`}
                                style={{ height: `${h}%`, opacity: 0.4 + (h / 100) * 0.5 }}
                              />
                            )
                          })}
                        </div>
                        <p className={`text-[9px] font-mono text-center mt-1.5 tracking-[0.2em] ${theme === 'light' ? 'text-slate-400' : 'text-slate-700'}`}>BIR TIKENDRAJIT UNIVERSITY</p>
                      </div>
                    </div>
                  </div>

                  {/* Academic snapshot */}
                  <div className="profile-panel overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
                      <BookOpen className="w-4 h-4 text-[#ed143d]" />
                      <span className="text-sm font-bold text-white">Academic Snapshot</span>
                    </div>
                    <div className="px-5 py-3">
                      <InfoRow label="Parent University"     value={a.parentUniversity} />
                      <InfoRow label="Academic Session"      value={a.academicSession} />
                      <InfoRow label="Sems at Parent Uni"   value={a.semesterCompletedAtParentUniversity ? `${a.semesterCompletedAtParentUniversity} Semesters` : undefined} />
                      <InfoRow label="Marketing Batch"       value={student.marketingBatch} />
                      <InfoRow label="Evaluated Subjects"    value={evalSubs.length > 0 ? `${evalSubs.length} subjects mapped` : undefined} />
                      <InfoRow label="Transferred Credits"   value={prevCr > 0 ? `${prevCr} credits` : undefined} />
                    </div>
                  </div>

                  {/* Fee status card */}
                  <div className={`overflow-hidden rounded-3xl border shadow-xl ${student.isFeeCompleted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                    <div className={`px-5 py-3 border-b ${student.isFeeCompleted ? 'border-emerald-500/15' : 'border-amber-500/15'} flex items-center gap-2`}>
                      {student.isFeeCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                      <span className="text-sm font-bold text-white">Fee Payment</span>
                    </div>
                    <div className="px-5 py-4">
                      <p className={`text-xl font-extrabold ${student.isFeeCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {student.isFeeCompleted ? 'Cleared' : 'Pending'}
                      </p>
                      <p className={`text-xs mt-1 ${student.isFeeCompleted ? 'text-emerald-500/70' : 'text-amber-500/70'}`}>
                        {student.isFeeCompleted
                          ? 'Fee payment confirmed and records updated.'
                          : 'Please contact the BTU accounts office to clear dues.'}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-[#ed143d]" />
              <span>Bir Tikendrajit University (BTU) — Student Academic Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />Credit Transfer Cell</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />academics@btu.ac.in</span>
            </div>
          </div>
        </footer>

      </main>
    </div>
  )
}
