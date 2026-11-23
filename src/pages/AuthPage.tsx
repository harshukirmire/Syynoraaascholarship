import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import authLibraryImg from '../assets/images/auth_academic_library_1795395065024.jpg';
import { useAuth } from '../contexts/AuthContext.tsx';
import { getFriendlyAuthError } from '../lib/firebase.ts';

interface AuthPageProps {
  mode: 'login' | 'signup';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({ mode }: AuthPageProps) {
  const { signInEmail, signUpEmail, signInGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setForgotMode(false);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!forgotMode && mode === 'signup' && !cleanName) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (forgotMode) {
      setSubmitting(true);
      try {
        await resetPassword(cleanEmail);
        setSuccessMsg('Password reset instructions have been sent to your email address.');
      } catch (err) {
        setErrorMsg(getFriendlyAuthError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInEmail(cleanEmail, password);
        setPassword('');
        navigate('/dashboard', { replace: true });
      } else {
        await signUpEmail(cleanEmail, password, cleanName);
        setPassword('');
        setConfirmPassword('');
        navigate('/profile-setup', { replace: true });
      }
    } catch (err) {
      setPassword('');
      setConfirmPassword('');
      setErrorMsg(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleSubmitting(true);
    try {
      await signInGoogle();
      // Route guard automatically directs to /profile-setup or /dashboard
    } catch (err) {
      setErrorMsg(getFriendlyAuthError(err));
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] grid grid-cols-1 lg:grid-cols-2">
      {/* Left Architectural Panel */}
      <div className="hidden lg:flex relative bg-zinc-950 text-white flex-col justify-between p-12 overflow-hidden">
        {!imgFailed && (
          <img
            src={authLibraryImg}
            alt="Minimalist monochrome university library atrium"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            SYNORA
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="font-display text-4xl font-semibold tracking-tight leading-tight text-white mb-4">
            Centralized scholarship discovery and guidance for students worldwide.
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed mb-8">
            Verify eligibility criteria, distinguish language tests from scholarship exams, prepare official document checklists, and track every application from one structured workspace.
          </p>
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/15 text-xs">
            <div>
              <p className="text-zinc-400">Scope</p>
              <p className="text-white font-medium mt-1">India &amp; Global</p>
            </div>
            <div>
              <p className="text-zinc-400">Verification</p>
              <p className="text-white font-medium mt-1">Official Sources</p>
            </div>
            <div>
              <p className="text-zinc-400">Guidance</p>
              <p className="text-white font-medium mt-1">Synora Guide AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-xl p-8">
          <div className="mb-8">
            <div className="lg:hidden mb-4">
              <span className="font-display text-xl font-bold tracking-tight text-zinc-900">
                SYNORA
              </span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">
              {forgotMode
                ? 'Reset password'
                : mode === 'login'
                ? 'Sign in to Synora'
                : 'Create your account'}
            </h2>
            <p className="text-sm text-zinc-600 mt-1.5">
              {forgotMode
                ? 'Enter your account email to receive a password reset link.'
                : mode === 'login'
                ? 'Access your saved scholarships, exam profile, and tracker.'
                : 'Set up your personal student workspace for scholarship guidance.'}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800"
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800"
            >
              {successMsg}
            </div>
          )}

          {!forgotMode && (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleSubmitting || submitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium bg-white border border-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-60"
              >
                {googleSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-zinc-400">or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {!forgotMode && mode === 'signup' && (
              <div>
                <label htmlFor="auth-full-name" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Full name
                </label>
                <input
                  id="auth-full-name"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-700 mb-1.5">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
              />
            </div>

            {!forgotMode && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-700">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(true);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-900"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {!forgotMode && mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-medium text-zinc-700 mb-1.5"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-900"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || googleSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>
                {forgotMode
                  ? 'Send Reset Link'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-200 text-center text-xs text-zinc-600">
            {forgotMode ? (
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-medium text-zinc-900 hover:underline underline-offset-4"
              >
                Back to Sign In
              </button>
            ) : mode === 'login' ? (
              <p>
                New to Synora?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-zinc-900 hover:underline underline-offset-4"
                >
                  Create an account
                </Link>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-zinc-900 hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
