import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { Search, Database, UserPlus, RefreshCw, GraduationCap, CheckCircle2, AlertCircle, Building2, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import AdminPageShell from '../components/AdminPageShell'
import { APP_URL } from '../lib/config'

export const Route = createFileRoute('/students')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const hasAuth = localStorage.getItem('staff-session') || localStorage.getItem('current-student')
    if (!hasAuth) throw redirect({ to: '/login' })
  },
  component: StudentDirectoryPage,
})

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
  }
  academicDetails?: {
    nameOfPrograme?: string
    branch?: string
    academicSession?: string
  }
  evaluation?: Record<string, unknown>
  createdAt?: string
}

const PAGE_SIZE = 20

function StudentDirectoryPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<DbStudent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

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

  return (
    <AdminPageShell activeItem="students">
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-8 min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#ed143d] text-xs font-bold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>MongoDB Database Directory — BTU</span>
          </div>
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
            {pagedStudents.map((student) => (
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
                  <span className="flex items-center gap-1 text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {student.university || 'BTU'}
                  </span>
                  <span className="font-mono text-amber-400">{student.studyMode || 'Credit Transfer'}</span>
                </div>

                <button
                  onClick={() => openEvaluationReport(student)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#ed143d]/10 border border-[#ed143d]/30 text-[#ed143d] text-xs font-semibold hover:bg-[#ed143d]/20 transition-colors"
                >
                  <Award className="w-3.5 h-3.5" />
                  View Evaluation Report
                </button>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-xs">
                    <th className="p-4 font-semibold">Student ID</th>
                    <th className="p-4 font-semibold">Name & Contact</th>
                    <th className="p-4 font-semibold">Program / Branch</th>
                    <th className="p-4 font-semibold">University</th>
                    <th className="p-4 font-semibold">Mode</th>
                    <th className="p-4 font-semibold">Verification</th>
                    <th className="p-4 font-semibold">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pagedStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#ed143d]">
                        {student.enrollmentID || student.applicationID || student._id}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-white">{student.personalDetails?.name || 'Unnamed Student'}</p>
                        <p className="text-xs text-slate-400">{student.personalDetails?.email || 'N/A'}</p>
                        {student.personalDetails?.mobileNumber && (
                          <p className="text-xs text-slate-500 font-mono">{student.personalDetails.mobileNumber}</p>
                        )}
                      </td>
                      <td className="p-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="truncate max-w-50">
                            {student.academicDetails?.nameOfPrograme || 'General Program'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-300">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{student.university || 'BTU'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono text-amber-400">{student.studyMode || 'Credit Transfer'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          student.isProfileVerified
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {student.isProfileVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openEvaluationReport(student)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ed143d]/10 border border-[#ed143d]/30 text-[#ed143d] text-xs font-semibold hover:bg-[#ed143d]/20 transition-colors"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Evaluation Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom pagination (desktop always, mobile only when multiple pages) */}
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
    </AdminPageShell>
  )
}
