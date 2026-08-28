import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { Search, Database, UserPlus, RefreshCw, GraduationCap, CheckCircle2, AlertCircle, Building2 } from 'lucide-react'

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
  createdAt?: string
}

function StudentDirectoryPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<DbStudent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#ed143d] text-xs font-bold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>MongoDB Database Directory — BTU</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Bir Tikendrajit University Student Directory</h1>
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
            <span>Import JSON</span>
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

      {/* Database Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading && students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ed143d]" />
                    <span>Loading BTU database records...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No student records found in MongoDB for <strong className="text-slate-300">Bir Tikendrajit University (BTU)</strong>. Use the <strong className="text-slate-300">Import JSON</strong> button to add records.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#ed143d]">
                      {student.enrollmentID || student.applicationID || student._id}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{student.personalDetails?.name || 'Unnamed Student'}</p>
                      <p className="text-xs text-slate-400">{student.personalDetails?.email || 'N/A'}</p>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {student.academicDetails?.nameOfPrograme || 'General Program'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-300 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{student.university || 'BTU'}</span>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
