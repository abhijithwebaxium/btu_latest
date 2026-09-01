import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, GraduationCap, Phone, AlertCircle, BookOpen, Award, Users } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, dob, university: 'BTU' }),
      });
      const data = await res.json();
      if (data.success && data.student) {
        localStorage.removeItem('staff-session');
        localStorage.setItem('current-student', JSON.stringify(data.student));
        navigate({ to: '/' });
      } else {
        setErrorMsg(data.error || 'Invalid BTU student phone number or date of birth.');
      }
    } catch (err) {
      setErrorMsg(`Connection error: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Background image */}
      <img src="/image/btu.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />

      {/* Two-panel card */}
      <div className="relative z-10 w-full max-w-3xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 flex flex-col sm:flex-row">

        {/* Left panel — branding */}
        <div className="relative sm:w-65 shrink-0 bg-linear-to-br from-[#ed143d] via-rose-700 to-rose-900 p-8 flex flex-col justify-between overflow-hidden">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-52 w-52 rounded-full bg-black/15" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

          {/* Top branding */}
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-5">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-black text-white leading-snug">
              Bir Tikendrajit<br />University
            </h1>
            <p className="mt-1.5 text-xs font-medium text-rose-200">Student Portal — BTU Campus OS</p>
          </div>

          {/* Feature list */}
          <div className="relative mt-6 space-y-3 hidden sm:block">
            {[
              { icon: BookOpen, text: 'Academic evaluations' },
              { icon: Users,    text: 'Campus resources' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-rose-100">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Bottom link */}
          <p className="relative mt-6 text-[11px] text-rose-300">
            Staff member?{' '}
            <a href="/admin/login" className="font-bold text-white hover:underline">
              Staff Sign In →
            </a>
          </p>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 bg-slate-900/90 backdrop-blur-xl p-8 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ed143d]/30 bg-[#ed143d]/10 px-3 py-1 text-[11px] font-bold text-[#ed143d]">
              Student Sign In
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Welcome back</h2>
            <p className="mt-1 text-xs text-slate-400">
              Enter your registered mobile number and date of birth.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 pointer-events-none" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-300">
                Mobile / WhatsApp Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#ed143d] focus:ring-2 focus:ring-[#ed143d]/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dob" className="block text-xs font-semibold text-slate-300">
                Date of Birth
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  id="dob"
                  type="text"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="e.g. 18092002 (DDMMYYYY)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#ed143d] focus:ring-2 focus:ring-[#ed143d]/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#ed143d] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#ed143d]/25 transition-colors hover:bg-rose-700 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying account...' : 'Sign in to BTU'}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 pointer-events-none" />
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-500">
            Protected by BTU Student Authentication
          </p>
        </div>

      </div>
    </main>
  );
}
