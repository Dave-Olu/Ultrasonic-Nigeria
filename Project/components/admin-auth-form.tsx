'use client';

import { useEffect, useState } from 'react';

export function AdminAuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailLinkStatus, setEmailLinkStatus] = useState('');
  const [isRequestingEmailLink, setIsRequestingEmailLink] = useState(false);
  const [emailLinkToken, setEmailLinkToken] = useState('');
  const [isCompletingEmailLink, setIsCompletingEmailLink] = useState(false);
  const isSignup = mode === 'signup';

  useEffect(() => {
    if (isSignup) return;
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    if (!token) return;
    setEmailLinkToken(token);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, [isSignup]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('');

    if (isSignup && password !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to continue.');
      window.location.href = '/admin';
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to continue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestEmailLink = async () => {
    setEmailLinkStatus('');
    setIsRequestingEmailLink(true);
    try {
      const response = await fetch('/api/auth/email-link', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to request a sign-in link.');
      setEmailLinkStatus(data.message || 'Check the admin email inbox for a sign-in link.');
    } catch (error) {
      setEmailLinkStatus(error instanceof Error ? error.message : 'Unable to request a sign-in link.');
    } finally {
      setIsRequestingEmailLink(false);
    }
  };

  const handleEmailLinkSignIn = async () => {
    setIsCompletingEmailLink(true);
    setEmailLinkStatus('');
    try {
      const response = await fetch('/api/auth/email-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: emailLinkToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sign in with this link.');
      window.location.href = '/admin';
    } catch (error) {
      setEmailLinkStatus(error instanceof Error ? error.message : 'Unable to sign in with this link.');
      setEmailLinkToken('');
    } finally {
      setIsCompletingEmailLink(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Ultrasonic admin</p>
        <h1 className="mt-3 text-3xl font-bold">{isSignup ? 'Create the admin account' : 'Welcome back'}</h1>
        <p className="mt-3 text-slate-300">{isSignup ? 'Set up the account that manages your public website.' : 'Sign in to manage services, projects, and images.'}</p>

        {!isSignup && (
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950 p-5">
            <h2 className="text-lg font-semibold text-white">Sign in by email</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">We’ll send a one-time sign-in link to the admin email address on file.</p>
            {emailLinkToken ? (
              <button type="button" onClick={handleEmailLinkSignIn} disabled={isCompletingEmailLink} className="mt-4 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70">
                {isCompletingEmailLink ? 'Signing in...' : 'Complete email sign-in'}
              </button>
            ) : (
              <button type="button" onClick={handleRequestEmailLink} disabled={isRequestingEmailLink} className="mt-4 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70">
                {isRequestingEmailLink ? 'Sending...' : 'Email me a sign-in link'}
              </button>
            )}
            {emailLinkStatus && <p role="status" className="mt-3 text-sm text-emerald-200">{emailLinkStatus}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {!isSignup && <p className="text-sm font-semibold text-slate-300">Or sign in with your password</p>}
          <label className="block text-sm font-medium text-slate-200">
            Email address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
          </label>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-200">Password</label>
            <div className="relative mt-2">
              <input id="admin-password" type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={8} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 pr-12 text-white outline-none focus:border-emerald-400" />
              <button type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} aria-label={isPasswordVisible ? 'Hide password' : 'Show password'} aria-pressed={isPasswordVisible} title={isPasswordVisible ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-300 transition hover:text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {isPasswordVisible ? (
                    <>
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A11 11 0 0 1 12 5c6 0 9.5 7 9.5 7a15 15 0 0 1-3 3.9M6.6 6.6C4 8.2 2.5 12 2.5 12a15 15 0 0 0 9.5 7 10 10 0 0 0 2.1-.2" />
                    </>
                  ) : (
                    <>
                      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
          {isSignup && (
            <div>
              <label htmlFor="admin-confirm-password" className="block text-sm font-medium text-slate-200">Confirm password</label>
              <div className="relative mt-2">
                <input id="admin-confirm-password" type={isConfirmPasswordVisible ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 pr-12 text-white outline-none focus:border-emerald-400" />
                <button type="button" onClick={() => setIsConfirmPasswordVisible((visible) => !visible)} aria-label={isConfirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'} aria-pressed={isConfirmPasswordVisible} title={isConfirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-300 transition hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {isConfirmPasswordVisible ? (
                      <>
                        <path d="m3 3 18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A11 11 0 0 1 12 5c6 0 9.5 7 9.5 7a15 15 0 0 1-3 3.9M6.6 6.6C4 8.2 2.5 12 2.5 12a15 15 0 0 0 9.5 7 10 10 0 0 0 2.1-.2" />
                      </>
                    ) : (
                      <>
                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          )}
          <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70">
            {isLoading ? 'Please wait...' : isSignup ? 'Create admin account' : 'Sign in'}
          </button>
          {status && <p role="alert" className="text-sm text-rose-300">{status}</p>}
        </form>

        <a href={isSignup ? '/admin/login' : '/admin/signup'} className="mt-6 block text-center text-sm font-semibold text-emerald-300 hover:text-emerald-200">
          {isSignup ? 'Already have an account? Sign in' : 'First time here? Create the admin account'}
        </a>
      </div>
    </main>
  );
}