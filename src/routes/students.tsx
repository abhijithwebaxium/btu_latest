import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import {
  Search, UserPlus, RefreshCw, GraduationCap, CheckCircle2,
  AlertCircle, Building2, Award, ChevronLeft, ChevronRight,
  ClipboardList, Folder, Briefcase, X, BookOpen,
} from 'lucide-react'
import AdminPageShell from '../components/AdminPageShell'
import { APP_URL } from '../lib/config'

export const Route = createFileRoute('/students')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const hasAuth = localStorage.getItem('staff-session') || localStorage.getItem('current-student')
    if (!hasAuth) throw redirect({ to: '/admin/login' })
  },
  component: StudentDirectoryPage,
})

interface EvalSubject {
  btuSubjectCode?: string
  btuSubjectTitle?: string
  subjectCode?: string
  semester?: number
  credits?: number
  examBatch?: string
  examBatchSr?: string
  examStatus?: string
  examSession?: string
  examSessionSr?: string
  mark?: number | string
  grade?: string
  equalized?: string
}

interface DbStudent {
  _id: string
  enrollmentID?: string
  applicationID?: string
  university?: string
  studyMode?: string
  status?: string
  isProfileVerified?: boolean
  isFeeCompleted?: boolean
  personalDetails?: {
    name?: string
    email?: string
    mobileNumber?: string | number
    category?: string
    dateOfBirth?: string
  }
  academicDetails?: {
    nameOfPrograme?: string
    branch?: string
    academicSession?: string
  }
  evaluation?: {
    approvalStage?: number
    evaluationStatus?: string
    subjects?: EvalSubject[]
  }
  branch?: string | { name?: string; shortCode?: string; [key: string]: unknown }
  createdAt?: string
}

type ModalTab = 'assignments' | 'projects' | 'internships'

const PROJECT_LABELS: Record<string, string> = {
  'M.I.P.R.S': 'Mini Project',
  'M.A.P.R.S.I': 'Major Project I',
  'M.A.P.R.S.II': 'Major Project II',
  'I.R.S': 'Internship',
}

const ASSIGNMENT_DATES: Record<string, string> = {
  'Dec-2024': '30th October 2024', 'June-2025': '30th April 2025',
  'Dec-2025': '30th October 2025', 'June-2026': '30th April 2026',
  'Dec-2026': '30th October 2026', 'June-2027': '30th April 2027',
}

function getStudentSubs(student: DbStudent) {
  const subjects = student.evaluation?.subjects || []
  const reappear = subjects.filter(
    s => s.equalized === 'reappear' || s.equalized === 're-submission' || s.equalized === 'improvement'
  )
  return {
    assignments: reappear.filter(s => s.examStatus === 'A.E.B.T.U.C'),
    projects: reappear.filter(s => ['M.I.P.R.S', 'M.A.P.R.S.I', 'M.A.P.R.S.II'].includes(s.examStatus || '')),
    internships: reappear.filter(s => s.examStatus === 'I.R.S'),
  }
}

const PAGE_SIZE = 20

/* ── Modal ─────────────────────────────────────────────────────────── */
function StudentAcademicModal({
  student,
  defaultTab,
  onClose,
}: {
  student: DbStudent
  defaultTab: ModalTab
  onClose: () => void
}) {
  const [tab, setTab] = useState<ModalTab>(defaultTab)
  const { assignments, projects, internships } = getStudentSubs(student)
  const name = student.personalDetails?.name || 'Student'

  const tabs: { id: ModalTab; label: string; icon: React.ElementType; subs: EvalSubject[] }[] = [
    { id: 'assignments', label: 'Assignments', icon: ClipboardList, subs: assignments },
    { id: 'projects',    label: 'Projects',    icon: Folder,        subs: projects    },
    { id: 'internships', label: 'Internships', icon: Briefcase,     subs: internships },
  ]
  const activeTab = tabs.find(t => t.id === tab)!
  const subs = activeTab.subs
  const totalCredits = subs.reduce((s, x) => s + (Number(x.credits) || 0), 0)
  const semCount = [...new Set(subs.map(s => s.semester).filter(Boolean))].length

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 student-academic-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="student-academic-modal w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent stripe */}
        <div className="h-0.75 bg-linear-to-r from-[#ed143d] via-[#ed143d]/60 to-transparent shrink-0" />

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-4 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-[#ed143d]/10 border border-[#ed143d]/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-[#ed143d]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">{name}</h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
              {student.enrollmentID || student.applicationID || student._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented tab switcher */}
        <div className="px-6 pb-5 shrink-0">
          <div className="flex gap-1 p-1 bg-slate-800 rounded-xl">
            {tabs.map(t => {
              const Icon = t.icon
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#ed143d] text-white shadow-lg shadow-[#ed143d]/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {t.label}
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {t.subs.length}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 bg-slate-900 custom-scrollbar">
          {subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No {activeTab.label.toLowerCase()} pending</p>
              <p className="text-xs text-slate-500 mt-1">This student has no {activeTab.label.toLowerCase()} to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { label: 'Subjects',  value: subs.length  },
                  { label: 'Credits',   value: totalCredits },
                  { label: 'Semesters', value: semCount     },
                ] as { label: string; value: number }[]).map(stat => (
                  <div key={stat.label} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-white tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Subject cards */}
              <div className="grid gap-2">
                {subs.map((sub, i) => {
                  const code      = sub.btuSubjectCode || sub.subjectCode || '—'
                  const title     = sub.btuSubjectTitle || '—'
                  const batch     = sub.examBatch || sub.examBatchSr || ''
                  const deadline  = tab === 'assignments' ? ASSIGNMENT_DATES[batch] : undefined
                  const typeLabel = tab !== 'assignments' ? (PROJECT_LABELS[sub.examStatus || ''] || sub.examStatus) : undefined

                  return (
                    <div key={i} className="relative bg-slate-800/50 border border-slate-700/40 rounded-xl overflow-hidden">
                      <div className="absolute left-0 inset-y-0 w-0.75 bg-[#ed143d]" />
                      <div className="pl-5 pr-4 pt-4 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-sm leading-snug">{title}</p>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{code}</p>
                          </div>
                          {typeLabel && (
                            <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg border bg-[#ed143d]/10 border-[#ed143d]/30 text-[#ed143d]">
                              {typeLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {sub.semester != null && (
                            <span className="text-[11px] bg-slate-900/60 text-slate-300 px-2 py-0.5 rounded-md font-medium">Sem {sub.semester}</span>
                          )}
                          {sub.credits != null && (
                            <span className="text-[11px] bg-slate-900/60 text-slate-300 px-2 py-0.5 rounded-md font-medium">{sub.credits} credits</span>
                          )}
                          {batch && (
                            <span className="text-[11px] bg-slate-900/60 text-slate-300 px-2 py-0.5 rounded-md font-medium">{batch}</span>
                          )}
                          {(sub.examSession || sub.examSessionSr) && (
                            <span className="text-[11px] bg-slate-900/60 text-slate-300 px-2 py-0.5 rounded-md font-medium">{sub.examSession || sub.examSessionSr}</span>
                          )}
                        </div>
                        {deadline && (
                          <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center gap-2 text-xs text-[#ed143d]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Deadline: <strong>{deadline}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────── */
function StudentDirectoryPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<DbStudent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [modalStudent, setModalStudent] = useState<DbStudent | null>(null)
  const [modalTab, setModalTab] = useState<ModalTab>('assignments')

  const loadStudents = async (query: string = '') => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/students?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.students)
      } else {
        setErrorMsg(data.error || 'Failed to fetch student records from MongoDB.')
      }
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const totalPages = Math.ceil(students.length / PAGE_SIZE)
  const pagedStudents = students.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const getPageNumbers = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const openEvaluationReport = (student: DbStudent) => {
    localStorage.setItem('admin-preview-student', JSON.stringify(student))
    window.open(`${APP_URL}/report?admin=1`, '_blank')
  }

  const openModal = (student: DbStudent, tab: ModalTab) => {
    setModalStudent(student)
    setModalTab(tab)
  }

  return (
    <AdminPageShell activeItem="students">
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-8 min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">BTU Student Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time student records persisted in MongoDB for Bir Tikendrajit University (BTU).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadStudents(searchQuery)}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate({ to: '/import' })}
            className="px-4 py-2.5 bg-[#ed143d] hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#ed143d]/30 flex items-center space-x-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Import Evaluation</span>
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center space-x-4 max-w-lg">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search BTU students by name, ID, email, or program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#ed143d] focus:ring-1 focus:ring-[#ed143d] transition-all"
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading / Empty states */}
      {isLoading && students.length === 0 && (
        <div className="p-8 text-center text-slate-500 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ed143d]" />
          <span>Loading BTU database records...</span>
        </div>
      )}
      {!isLoading && students.length === 0 && (
        <div className="p-8 text-center text-slate-500 bg-slate-900/90 border border-slate-800 rounded-2xl">
          No student records found in MongoDB for <strong className="text-slate-300">Bir Tikendrajit University (BTU)</strong>. Use the <strong className="text-slate-300">Import Evaluation</strong> button to add records.
        </div>
      )}

      {students.length > 0 && (
        <>
          {/* Mobile top bar: count + page controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between md:hidden">
              <p className="text-xs text-slate-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, students.length)} of {students.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-semibold text-slate-300">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {pagedStudents.map((student) => {
              const { assignments, projects, internships } = getStudentSubs(student)
              return (
                <div key={student._id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{student.personalDetails?.name || 'Unnamed Student'}</p>
                      <p className="text-xs font-mono font-bold text-[#ed143d] mt-0.5">
                        {student.enrollmentID || student.applicationID || student._id}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      student.isProfileVerified
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {student.isProfileVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    {student.personalDetails?.email && (
                      <p className="truncate">{student.personalDetails.email}</p>
                    )}
                    {student.personalDetails?.mobileNumber && (
                      <p className="font-mono text-slate-500">{student.personalDetails.mobileNumber}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1 text-slate-300">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate max-w-45">{student.academicDetails?.nameOfPrograme || 'General Program'}</span>
                    </span>
                    {student.branch && (
                      <span className="text-slate-400">{typeof student.branch === 'object' ? student.branch?.name : student.branch}</span>
                    )}
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {student.university || 'BTU'}
                    </span>
                    <span className="font-mono text-amber-400">{student.studyMode || 'Credit Transfer'}</span>
                    {student.createdAt && (
                      <span className="text-slate-500 font-mono">
                        Imported: {(() => { const d = new Date(student.createdAt!); return isNaN(d.getTime()) ? '—' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` })()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openEvaluationReport(student)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#ed143d]/10 border border-[#ed143d]/30 text-[#ed143d] text-xs font-semibold hover:bg-[#ed143d]/20 transition-colors"
                    >
                      <Award className="w-3.5 h-3.5" />
                      Eval Report
                    </button>
                    <button
                      onClick={() => openModal(student, 'assignments')}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-colors"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Assignments {assignments.length > 0 && <span className="ml-0.5 text-[10px] font-bold">({assignments.length})</span>}
                    </button>
                    <button
                      onClick={() => openModal(student, 'projects')}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-colors"
                    >
                      <Folder className="w-3.5 h-3.5" />
                      Projects {projects.length > 0 && <span className="ml-0.5 text-[10px] font-bold">({projects.length})</span>}
                    </button>
                    <button
                      onClick={() => openModal(student, 'internships')}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Internships {internships.length > 0 && <span className="ml-0.5 text-[10px] font-bold">({internships.length})</span>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 border-b-2 border-slate-700 text-slate-100 uppercase text-sm tracking-[0.12em]">
                    <th className="p-4 font-bold">Name & Contact</th>
                    <th className="p-4 font-bold">Program / Branch</th>
                    <th className="p-4 font-bold">Imported On</th>
                    <th className="p-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pagedStudents.map((student) => {
                    const { assignments, projects, internships } = getStudentSubs(student)
                    return (
                      <tr key={student._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-white">{student.personalDetails?.name || 'Unnamed Student'}</p>
                          <p className="text-xs text-slate-400">{student.personalDetails?.email || 'N/A'}</p>
                          {student.personalDetails?.mobileNumber && (
                            <p className="text-xs text-slate-500 font-mono">{student.personalDetails.mobileNumber}</p>
                          )}
                          {student.personalDetails?.dateOfBirth && (
                            <p className="text-xs text-slate-500 mt-0.5">{(() => { const d = new Date(student.personalDetails.dateOfBirth!); return isNaN(d.getTime()) ? student.personalDetails.dateOfBirth : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` })()}</p>
                          )}
                        </td>
                        <td className="p-4 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="truncate max-w-50">
                              {student.academicDetails?.nameOfPrograme || 'General Program'}
                            </span>
                          </div>
                          {student.branch && (
                            <p className="text-xs text-slate-500 mt-1 ml-5.5">{typeof student.branch === 'object' ? student.branch?.name : student.branch}</p>
                          )}
                        </td>
                        <td className="p-4 text-slate-400">
                          {student.createdAt ? (
                            <span className="text-xs font-mono">
                              {(() => { const d = new Date(student.createdAt!); return isNaN(d.getTime()) ? '—' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` })()}
                            </span>
                          ) : <span className="text-xs text-slate-600">—</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEvaluationReport(student)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              <Award className="w-3.5 h-3.5" /> Report
                            </button>
                            <button
                              onClick={() => openModal(student, 'assignments')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              <ClipboardList className="w-3.5 h-3.5" /> Assignments
                              {assignments.length > 0 && <span className="ml-0.5 text-slate-200">({assignments.length})</span>}
                            </button>
                            <button
                              onClick={() => openModal(student, 'projects')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              <Folder className="w-3.5 h-3.5" /> Projects
                              {projects.length > 0 && <span className="ml-0.5 text-slate-200">({projects.length})</span>}
                            </button>
                            <button
                              onClick={() => openModal(student, 'internships')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              <Briefcase className="w-3.5 h-3.5" /> Internships
                              {internships.length > 0 && <span className="ml-0.5 text-slate-200">({internships.length})</span>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom pagination */}
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 ${totalPages <= 1 ? 'md:flex hidden' : ''}`}>
            <p className="text-xs text-slate-500 order-2 sm:order-1">
              {totalPages > 1
                ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, students.length)} of ${students.length} students`
                : `${students.length} student${students.length !== 1 ? 's' : ''} total`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getPageNumbers().map((page, i) =>
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-slate-600 text-sm select-none">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-9 h-9 rounded-lg border text-xs font-semibold transition-colors ${
                        currentPage === page
                          ? 'bg-[#ed143d] border-[#ed143d] text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>

    {/* Academic detail modal */}
    {modalStudent && (
      <StudentAcademicModal
        student={modalStudent}
        defaultTab={modalTab}
        onClose={() => setModalStudent(null)}
      />
    )}

    </AdminPageShell>
  )
}
