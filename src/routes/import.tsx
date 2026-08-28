import { useState, useRef, useEffect } from 'react'
import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  GraduationCap,
  Sparkles,
  Building2,
  Trash2,
  Database,
  RefreshCw,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import type { StudentRecord } from '../lib/studentParser'
import AdminPageShell from '../components/AdminPageShell'

export const Route = createFileRoute('/import')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const hasAuth = localStorage.getItem('staff-session') || localStorage.getItem('current-student')
    if (!hasAuth) throw redirect({ to: '/login' })
  },
  component: JsonImportPage,
})

function JsonImportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [lastImported, setLastImported] = useState<StudentRecord[] | null>(null)
  const [totalDbCount, setTotalDbCount] = useState<number>(0)

  const xlsxInputRef = useRef<HTMLInputElement>(null)
  const [xlsxLoading, setXlsxLoading] = useState(false)
  const [xlsxMsg, setXlsxMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadDbCount = async () => {
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      if (data.success) {
        setTotalDbCount(data.students.length)
      }
    } catch {
      // Ignore count errors
    }
  }

  useEffect(() => {
    loadDbCount()
  }, [])

  const handleFile = async (file: File) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setLastImported(null)
    setIsLoading(true)

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setErrorMsg('Please upload a valid .json file exported from BTU ERP.')
      setIsLoading(false)
      return
    }

    try {
      const text = await file.text()
      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      })

      const data = await res.json()

      if (data.success) {
        setSuccessMsg(`Successfully processed ${data.count} student record(s) into BTU MongoDB database!`)
        setLastImported(data.records || null)
        await loadDbCount()
      } else {
        setErrorMsg(data.error || 'Failed to import student JSON into BTU MongoDB database.')
      }
    } catch (err) {
      setErrorMsg(`File reading error: ${(err as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all Bir Tikendrajit University (BTU) student records from MongoDB?')) {
      setIsLoading(true)
      try {
        const adminKey = typeof window !== 'undefined' ? sessionStorage.getItem('admin-key') || '' : ''
        const res = await fetch('/api/students', {
          method: 'DELETE',
          headers: { 'X-Admin-Key': adminKey },
        })
        const data = await res.json()
        if (data.success) {
          setSuccessMsg('All imported BTU records have been cleared from MongoDB.')
          setLastImported(null)
          setTotalDbCount(0)
        } else {
          setErrorMsg(`Failed to clear BTU database: ${data.error}`)
        }
      } catch (err) {
        setErrorMsg(`Clear failed: ${(err as Error).message}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSubjectsExcel = async (file: File) => {
    setXlsxMsg(null)
    setXlsxLoading(true)
    try {
      const buf = await file.arrayBuffer()
      const wb  = XLSX.read(buf, { type: 'array' })
      const ws  = wb.Sheets[wb.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

      const normalize = (k: string) => k.toLowerCase().replace(/[\s_-]/g, '')
      const pick = (row: Record<string, unknown>, ...keys: string[]) => {
        for (const key of keys) {
          for (const col of Object.keys(row)) {
            if (normalize(col) === normalize(key)) return String(row[col] || '').trim()
          }
        }
        return ''
      }

      const rows = rawRows
        .map(row => ({
          enrollmentID:   pick(row, 'enrollmentID', 'enrollmentId', 'enrollment id', 'enrollment', 'studentID', 'student id', 'id'),
          btuSubjectCode: pick(row, 'btuSubjectCode', 'subject code', 'subjectCode', 'code'),
          btuSubjectTitle:pick(row, 'btuSubjectTitle', 'subject title', 'subjectTitle', 'title', 'subject name', 'subjectName', 'name'),
          semester:       Number(pick(row, 'semester', 'sem')) || 0,
          credits:        Number(pick(row, 'credits', 'credit')) || 0,
        }))
        .filter(r => r.enrollmentID && r.btuSubjectCode && r.btuSubjectTitle)

      if (rows.length === 0) {
        setXlsxMsg({ type: 'error', text: 'No valid rows found. Ensure columns: Enrollment ID, Subject Code, Subject Title, Semester, Credits.' })
        return
      }

      const res  = await fetch('/api/evaluation/update-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      })
      const data = await res.json()
      if (data.success) {
        setXlsxMsg({ type: 'success', text: `Updated ${data.updated} subject(s). ${data.notFound} row(s) had no matching evaluation entry.` })
      } else {
        setXlsxMsg({ type: 'error', text: data.error || 'Update failed.' })
      }
    } catch (err) {
      setXlsxMsg({ type: 'error', text: `Error: ${(err as Error).message}` })
    } finally {
      setXlsxLoading(false)
      if (xlsxInputRef.current) xlsxInputRef.current.value = ''
    }
  }

  return (
    <AdminPageShell activeItem="import">
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#ed143d] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>BTU Data Synchronization Hub</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Import Student JSON (BTU)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload student JSON records exported from BTU ERP to populate your MongoDB cluster.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-400">
            <Database className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>MongoDB Connected ({totalDbCount} BTU Records)</span>
          </div>

          {totalDbCount > 0 && (
            <>
              <button
                onClick={() => navigate({ to: '/students' })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ed143d] text-white font-bold text-sm shadow-lg shadow-[#ed143d]/30 hover:bg-rose-700 transition-all"
              >
                <span>View BTU DB ({totalDbCount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleClear}
                className="p-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Clear BTU Database Records"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Drag-and-Drop Area */}
      <div
        onDragOver={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden group ${
          isDragging
            ? 'border-[#ed143d] bg-[#ed143d]/10 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/80 hover:border-[#ed143d]/50 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0])
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-[#ed143d]/10 text-[#ed143d] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
            {isLoading ? <RefreshCw className="w-10 h-10 animate-spin text-[#ed143d]" /> : <FileJson className="w-10 h-10" />}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-bold text-white">
              {isLoading ? 'Processing & Persisting to BTU Database...' : 'Drop your BTU ERP Student JSON file here'}
            </p>
            <p className="text-xs text-slate-400">
              or click to browse your computer (e.g. <span className="font-mono text-[#ed143d] font-semibold">Student_Export_*.json</span>)
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ed143d]/10 border border-[#ed143d]/30 text-xs font-semibold text-[#ed143d]">
            <Upload className="w-3.5 h-3.5" />
            <span>Select .json file for BTU</span>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      <AnimatePresence mode="wait">
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3 text-sm font-semibold"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-sm font-semibold"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => navigate({ to: '/students' })}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Go to Directory
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject Codes Excel Upload */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Update Reappear Subject Codes
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">Excel</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload an <span className="font-mono text-amber-400">.xlsx</span> file to fill in missing BTU subject codes and titles for reappear evaluation entries.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-amber-400" />Required Excel columns (any order, flexible names):</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
            {['Enrollment ID', 'Subject Code', 'Subject Title', 'Semester', 'Credits'].map(col => (
              <span key={col} className="font-mono px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-center">{col}</span>
            ))}
          </div>
        </div>

        <input
          ref={xlsxInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleSubjectsExcel(e.target.files[0]) }}
        />

        <button
          onClick={() => xlsxInputRef.current?.click()}
          disabled={xlsxLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          {xlsxLoading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
            : <><Upload className="w-4 h-4" /> Upload Excel</>
          }
        </button>

        <AnimatePresence mode="wait">
          {xlsxMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                xlsxMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {xlsxMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{xlsxMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recently Imported Preview */}
      {lastImported && Array.isArray(lastImported) && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#ed143d]" />
            <span>Recently Imported BTU Records</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lastImported.map((stu, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ed143d]/10 text-[#ed143d] flex items-center justify-center font-black text-sm shrink-0">
                    {stu.personalDetails?.name?.charAt(0) || 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">
                      {stu.personalDetails?.name || 'Unnamed Student'}
                    </p>
                    <p className="text-xs text-slate-400 truncate font-mono">
                      ID: {stu.enrollmentID || stu.applicationID || stu._id}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800 pt-2">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-500" /> University:
                    </span>
                    <span className="font-semibold text-white">{stu.university || 'BTU'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-slate-500" /> Program:
                    </span>
                    <span className="font-semibold text-white truncate max-w-[140px]">
                      {stu.academicDetails?.nameOfPrograme || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </AdminPageShell>
  )
}
