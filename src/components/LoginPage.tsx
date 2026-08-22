import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, BookOpenCheck, GraduationCap, LockKeyhole, Mail, Moon, ShieldCheck, Sparkles, Sun, UserCheck, AlertCircle, Phone } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<string>('dark');
  const [loginRole, setLoginRole] = useState<'staff' | 'student'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('edupulse-theme') || 'dark';
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('edupulse-theme', nextTheme);
    }
  };

  const handleRoleChange = (role: 'staff' | 'student') => {
    setLoginRole(role);
    setErrorMsg(null);
    if (role === 'staff') {
      if (emailRef.current) emailRef.current.value = 'admin@edupulse.edu';
      if (passwordRef.current) passwordRef.current.value = 'edupulse';
    } else {
      if (emailRef.current) emailRef.current.value = '';
      if (passwordRef.current) passwordRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    const email = emailRef.current?.value ?? '';
    const password = passwordRef.current?.value ?? '';

    if (loginRole === 'staff') {
      navigate({ to: '/' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.student) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('edupulse-current-student', JSON.stringify(data.student));
        }
        navigate({ to: '/' });
      } else {
        setErrorMsg(data.error || 'Invalid student email or mobile number.');
      }
    } catch (err) {
      setErrorMsg(`Connection error: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-[#ed143d] selection:text-white">
      <div className="pointer-events-none absolute inset-0 z-0 select-none">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#ed143d]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none login-grid absolute inset-0 opacity-30" />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        className="absolute right-6 top-6 z-50 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 shadow-lg transition-colors hover:border-[#ed143d]/40 hover:text-[#ed143d]"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5 pointer-events-none" /> : <Moon className="h-5 w-5 pointer-events-none" />}
      </button>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ed143d] to-rose-500 shadow-xl shadow-[#ed143d]/25">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-wide text-white">EduPulse</p>
              <p className="text-xs text-slate-400">TanStack Start Campus OS</p>
            </div>
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-[1.08] tracking-tight text-white">
            Your campus, clear and connected.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
            One intelligent workspace for academic performance, student progress, placements, projects, and campus support.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <BookOpenCheck className="mb-3 h-5 w-5 text-[#ed143d]" />
              <p className="text-sm font-bold text-white">Academic clarity</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Live performance and evaluation insights.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <ShieldCheck className="mb-3 h-5 w-5 text-[#ed143d]" />
              <p className="text-sm font-bold text-white">MongoDB Authentication</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Student login with Email & Phone number.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#ed143d] to-rose-500">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white">EduPulse</span>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl shadow-black/20 sm:p-9">
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  loginRole === 'student' ? 'bg-[#ed143d] text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 pointer-events-none" />
                <span>Student Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('staff')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  loginRole === 'staff' ? 'bg-[#ed143d] text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 pointer-events-none" />
                <span>Staff Portal</span>
              </button>
            </div>

            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ed143d]/30 bg-[#ed143d]/10 px-3 py-1 text-[11px] font-bold text-[#ed143d]">
                <Sparkles className="h-3.5 w-3.5 pointer-events-none" />
                {loginRole === 'student' ? 'Student Sign In' : 'Institutional Portal'}
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
                {loginRole === 'student' ? 'Sign in to Student OS' : 'Sign in to Staff Portal'}
              </h2>
              <p className="mt-1.5 text-xs text-slate-400">
                {loginRole === 'student'
                  ? 'Enter your registered email address and mobile number.'
                  : 'Use your institutional administrator credentials.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 pointer-events-none" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300">
                  {loginRole === 'student' ? 'Student Email Address' : 'Email Address'}
                </label>
                <div className="relative">
                  <input
                    ref={emailRef}
                    id="login-email"
                    name="email"
                    type="text"
                    required
                    defaultValue=""
                    placeholder={loginRole === 'student' ? 'e.g. sophia.c@edu.io' : 'admin@edupulse.edu'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#ed143d] focus:ring-2 focus:ring-[#ed143d]/30"
                  />
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-300">
                    {loginRole === 'student' ? 'Mobile / WhatsApp Number' : 'Password'}
                  </label>
                  {loginRole === 'staff' && (
                    <button type="button" className="text-xs font-medium text-[#ed143d] hover:underline">Forgot password?</button>
                  )}
                </div>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="login-password"
                    name="password"
                    type={loginRole === 'student' ? 'text' : 'password'}
                    required
                    defaultValue=""
                    placeholder={loginRole === 'student' ? 'e.g. 9876543210' : '••••••••'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#ed143d] focus:ring-2 focus:ring-[#ed143d]/30"
                  />
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    {loginRole === 'student' ? <Phone className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#ed143d] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#ed143d]/25 transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying Account...' : loginRole === 'student' ? 'Sign in as Student' : 'Sign in to Dashboard'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 pointer-events-none" />
              </button>
            </form>

            <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">
              Protected by EduPulse MongoDB Authentication
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
