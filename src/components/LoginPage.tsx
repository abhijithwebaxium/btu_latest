import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, BookOpenCheck, GraduationCap, LockKeyhole, Mail, Moon, ShieldCheck, Sparkles, Sun, UserCheck, AlertCircle, Phone } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<string>('dark');
  const [loginRole, setLoginRole] = useState<'staff' | 'student'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('university-theme') || 'dark';
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('university-theme', nextTheme);
    }
  };

  const handleRoleChange = (role: 'staff' | 'student') => {
    setLoginRole(role);
    setErrorMsg(null);
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);

    setIsLoading(true);
    try {
      if (loginRole === 'staff') {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.success) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('current-student');
            localStorage.setItem('staff-session', '1');
            localStorage.setItem('admin-key', password);
          }
          navigate({ to: '/' });
        } else {
          setErrorMsg(data.error || 'Invalid staff credentials.');
        }
        return;
      }

      // Student Login via MongoDB API for BTU
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, university: 'BTU' }),
      });

      const data = await res.json();

      if (data.success && data.student) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('staff-session');
          localStorage.setItem('current-student', JSON.stringify(data.student));
        }
        navigate({ to: '/' });
      } else {
        setErrorMsg(data.error || 'Invalid BTU student email or mobile number.');
      }
    } catch (err) {
      setErrorMsg(`Connection error: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-[#ed143d] selection:text-white">
      {/* Background Decorator */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#ed143d]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none login-grid absolute inset-0 opacity-30" />
      </div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        className="absolute right-6 top-6 z-50 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 shadow-lg transition-colors hover:border-[#ed143d]/40 hover:text-[#ed143d]"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5 pointer-events-none" /> : <Moon className="h-5 w-5 pointer-events-none" />}
      </button>

      <div className="relative z-20 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        {/* Left Side Content */}
        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ed143d] to-rose-500 shadow-xl shadow-[#ed143d]/25">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-wide text-white">Bir Tikendrajit University</p>
              <p className="text-xs text-slate-400">BTU Campus Management & Evaluation OS</p>
            </div>
          </div>

          <h1 className="max-w-xl text-5xl font-black leading-[1.08] tracking-tight text-white">
            Bir Tikendrajit University (BTU)
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
            Dedicated university portal for academic evaluation, credit transfer mapping, student progress tracking, and campus administration.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <BookOpenCheck className="mb-3 h-5 w-5 text-[#ed143d]" />
              <p className="text-sm font-bold text-white">Academic Evaluations</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Equalized BTU subject & credit evaluation.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <ShieldCheck className="mb-3 h-5 w-5 text-[#ed143d]" />
              <p className="text-sm font-bold text-white">BTU Student Records</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">MongoDB persisted ERP data integration.</p>
            </div>
          </div>
        </section>

        {/* Right Side Login Form */}
        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#ed143d] to-rose-500">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white">Bir Tikendrajit University</span>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl shadow-black/20 sm:p-9 relative z-30 space-y-6">
            {/* Account Type Tabs */}
            <div>
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleRoleChange('student')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    loginRole === 'student'
                      ? 'bg-[#ed143d] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 pointer-events-none" />
                  <span>Student Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('staff')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    loginRole === 'staff'
                      ? 'bg-[#ed143d] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 pointer-events-none" />
                  <span>Staff Sign In</span>
                </button>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ed143d]/30 bg-[#ed143d]/10 px-3 py-1 text-[11px] font-bold text-[#ed143d]">
                <Sparkles className="h-3.5 w-3.5 pointer-events-none" />
                BTU {loginRole === 'student' ? 'Student Sign In' : 'Institutional Portal'}
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
                Sign in to BTU
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {loginRole === 'student'
                  ? 'Enter your registered student email address and mobile number.'
                  : 'Access the Bir Tikendrajit University staff dashboard.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 pointer-events-none" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300">
                  {loginRole === 'student' ? 'BTU Student Email' : 'Staff Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-500" />
                  <input
                    id="login-email"
                    name="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={loginRole === 'student' ? 'e.g. student@btu.ac.in' : 'staff@btu.ac.in'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#ed143d] focus:ring-2 focus:ring-[#ed143d]/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-300">
                    {loginRole === 'student' ? 'Mobile / WhatsApp Number' : 'Password'}
                  </label>
                  {loginRole === 'staff' && (
                    <button type="button" className="text-xs font-medium text-[#ed143d] hover:underline cursor-pointer">Forgot password?</button>
                  )}
                </div>
                <div className="relative">
                  {loginRole === 'student'
                    ? <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-500" />
                    : <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-500" />
                  }
                  <input
                    id="login-password"
                    name="password"
                    type={loginRole === 'student' ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={loginRole === 'student' ? 'e.g. 9876543210' : '••••••••'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#ed143d] focus:ring-2 focus:ring-[#ed143d]/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#ed143d] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#ed143d]/25 transition-colors hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Verifying BTU Account...' : loginRole === 'student' ? 'Sign in to BTU' : 'Open BTU Staff Dashboard'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 pointer-events-none" />
              </button>
            </form>

            <p className="text-center text-[11px] leading-5 text-slate-500">
              Protected by Bir Tikendrajit University (BTU) Student Authentication
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
