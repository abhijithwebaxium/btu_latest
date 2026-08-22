import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  GraduationCap,
  LogOut,
  User,
  CheckCircle2,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  BookOpen,
  Award,
  Mail,
  MapPin,
} from 'lucide-react'

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
    name?: string
    fatherName?: string
    motherName?: string
    dateOfBirth?: string
    mobileNumber?: string | number
    whatsAppNumber?: string | number
    email?: string
    gender?: string
    category?: string
    bloodGroup?: string
    permanentAddress?: string
    district?: string
    state?: string
    country?: string
  }
  academicDetails?: {
    nameOfPrograme?: string
    branch?: string
    parentUniversity?: string
    semesterCompletedAtParentUniversity?: number
    academicSession?: string
  }
  course?: {
    name?: string
    shortCode?: string
    university?: string
  }
  branch?: {
    name?: string
    shortCode?: string
  }
  evaluation?: {
    approvalStage?: number
    evaluationStatus?: string
    subjects?: Array<{
      btuSubjectCode?: string
      btuSubjectTitle?: string
      semester?: number
      equalized?: string
      grade?: string
      mark?: number | string
      credits?: number
      examBatch?: string
      examStatus?: string
    }>
  }
  prevUniSubjects?: {
    prevUniSubDetails?: Array<{
      subjectTitle?: string
      subjectCode?: string
      credits?: number
      grade?: string
      mark?: number | string
      result?: string
      semester?: number
    }>
  }
}

export default function StudentDashboard({ student, onSignOut }: { student: LoggedInStudent; onSignOut: () => void }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'evaluation' | 'transcripts' | 'profile'>('overview')

  const personal = student.personalDetails || {}
  const academic = student.academicDetails || {}
  const evalData = student.evaluation || {}
  const prevData = student.prevUniSubjects || {}

  const evalSubjects = evalData.subjects || []
  const prevSubjects = prevData.prevUniSubDetails || []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ed143d] to-rose-500 shadow-xl shadow-[#ed143d]/25">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#ed143d] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bir Tikendrajit University (BTU)</span>
            </div>
            <h1 className="text-2xl font-black text-white">{personal.name || 'Student Account'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/students' })}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Student Directory
          </button>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Student Banner Card */}
      <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#ed143d]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ed143d] to-rose-700 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-[#ed143d]/30 shrink-0">
              {personal.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-800 text-rose-400 font-bold border border-slate-700">
                  ID: {student.enrollmentID || student.applicationID || student._id}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {student.isProfileVerified ? 'Verified Profile' : 'Pending Verification'}
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">{personal.name || 'Unnamed Student'}</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {academic.nameOfPrograme || (student.course as { name?: string })?.name || 'Degree Program'} — {academic.branch || (student.branch as { name?: string })?.name || 'Branch'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2 text-xs text-slate-300 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>University: <strong className="text-white">Bir Tikendrajit University (BTU)</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Admission Batch: <strong className="text-white">{student.admissionBatch || 'N/A'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Study Mode: <strong className="text-amber-400 font-mono">{student.studyMode || 'Credit Transfer'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-[#ed143d] text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'evaluation'
              ? 'border-[#ed143d] text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>BTU Evaluation ({evalSubjects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('transcripts')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'transcripts'
              ? 'border-[#ed143d] text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Transcripts ({prevSubjects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-[#ed143d] text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Info</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">BTU Evaluation Status</p>
              <p className="text-2xl font-black text-white">{evalData.evaluationStatus || 'Pending'}</p>
              <p className="text-xs text-slate-500">Stage {evalData.approvalStage || 0} Approval</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">BTU Evaluated Subjects</p>
              <p className="text-2xl font-black text-emerald-400">{evalSubjects.length}</p>
              <p className="text-xs text-slate-500">Equalized Courses</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transferred Subjects</p>
              <p className="text-2xl font-black text-amber-400">{prevSubjects.length}</p>
              <p className="text-xs text-slate-500">Parent University Credits</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evaluation' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-white flex items-center justify-between">
            <span>Bir Tikendrajit University (BTU) Academic Evaluation & Subject Mapping</span>
            <span className="text-xs text-slate-400 font-normal">Status: {evalData.evaluationStatus || 'Pending'}</span>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-xs">
                <th className="p-4 font-semibold">Subject Code</th>
                <th className="p-4 font-semibold">BTU Subject Title</th>
                <th className="p-4 font-semibold">Sem</th>
                <th className="p-4 font-semibold">Grade / Mark</th>
                <th className="p-4 font-semibold">Equalized Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {evalSubjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No evaluated subjects available yet.
                  </td>
                </tr>
              ) : (
                evalSubjects.map((sub, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#ed143d]">{sub.btuSubjectCode || 'N/A'}</td>
                    <td className="p-4 font-semibold text-white">{sub.btuSubjectTitle || 'General Subject'}</td>
                    <td className="p-4 font-mono text-slate-300">{sub.semester || 1}</td>
                    <td className="p-4 font-bold text-emerald-400">{sub.grade || sub.mark || 'A'}</td>
                    <td className="p-4 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                        {sub.equalized || 'Approved'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'transcripts' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-white">
            <span>Previous University Credit Transfers ({academic.parentUniversity || 'Parent Uni'})</span>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-xs">
                <th className="p-4 font-semibold">Subject Code</th>
                <th className="p-4 font-semibold">Original Subject Title</th>
                <th className="p-4 font-semibold">Sem</th>
                <th className="p-4 font-semibold">Credits</th>
                <th className="p-4 font-semibold">Mark / Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {prevSubjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No credit transfer subjects listed.
                  </td>
                </tr>
              ) : (
                prevSubjects.map((sub, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-400">{sub.subjectCode || 'N/A'}</td>
                    <td className="p-4 font-semibold text-white">{sub.subjectTitle || 'Transferred Subject'}</td>
                    <td className="p-4 font-mono text-slate-300">{sub.semester || 1}</td>
                    <td className="p-4 font-bold text-slate-200">{sub.credits || 3}</td>
                    <td className="p-4 font-bold text-emerald-400">{sub.grade || sub.mark || 'Passed'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#ed143d]" />
              <span>Contact Information</span>
            </h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-semibold text-white">{personal.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Mobile Number:</span>
                <span className="font-semibold text-white">{personal.mobileNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">WhatsApp Number:</span>
                <span className="font-semibold text-white">{personal.whatsAppNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#ed143d]" />
              <span>Address & Bio</span>
            </h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Date of Birth:</span>
                <span className="font-semibold text-white">{personal.dateOfBirth || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Gender / Category:</span>
                <span className="font-semibold text-white">{personal.gender || 'N/A'} / {personal.category || 'General'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Permanent Address:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">{personal.permanentAddress || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
