import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase }       from '../api/client'
import LoadingSpinner     from '../components/LoadingSpinner'

// ── Password strength ─────────────────────────────────────────────────────────
const STRENGTH_MAP = {
  0: { label: '',       color: 'bg-slate-200' },
  1: { label: 'Weak',   color: 'bg-red-500'   },
  2: { label: 'Fair',   color: 'bg-amber-500' },
  3: { label: 'Good',   color: 'bg-blue-500'  },
  4: { label: 'Strong', color: 'bg-green-500' },
}

function getStrength(pass) {
  if (!pass) return { score: 0, ...STRENGTH_MAP[0] }
  let score = 0
  if (pass.length >= 8)          score++
  if (/[A-Z]/.test(pass))        score++
  if (/[0-9]/.test(pass))        score++
  if (/[^A-Za-z0-9]/.test(pass)) score++
  return { score, ...STRENGTH_MAP[score] }
}

// ── Error mapper ──────────────────────────────────────────────────────────────
function friendlyError(msg = '') {
  if (msg.includes('already registered') || msg.includes('already exists'))
    return 'An account with this email already exists. Try signing in instead.'
  if (msg.includes('invalid email') || msg.includes('Email address'))
    return 'Please enter a valid email address.'
  if (msg.includes('Password should be'))
    return 'Password must be at least 6 characters.'
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error. Please check your connection.'
  return msg || 'Sign up failed. Please try again.'
}

// ── Resend confirmation email ─────────────────────────────────────────────────
async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type:  'signup',
    email: email.trim().toLowerCase(),
  })
  return error
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate()
  const location = useLocation()

  // Preserve redirect destination from PrivateRoute
  const from = location.state?.from || '/chat'

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirmPass,  setConfirmPass]  = useState('')
  const [fullName,     setFullName]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(false)
  const [showPass,     setShowPass]     = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [agreed,       setAgreed]       = useState(false)
  const [resending,    setResending]    = useState(false)
  const [resendSent,   setResendSent]   = useState(false)

  const strength = getStrength(password)

  // SEO
  useEffect(() => {
    document.title = 'Create Account — BarPrep AI'
  }, [])

  // Clear error on any field change
  const clearError = useCallback(() => {
    if (error) setError('')
  }, [error])

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    if (!fullName.trim())
      return 'Please enter your full name.'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Please enter a valid email address.'
    if (password.length < 6)
      return 'Password must be at least 6 characters.'
    if (password !== confirmPass)
      return 'Passwords do not match.'
    if (!agreed)
      return 'Please agree to the Terms of Service and Privacy Policy.'
    return null
  }, [fullName, email, password, confirmPass, agreed])

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email:    email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          // Sync full_name to profiles table via Supabase trigger
        },
      })
      if (authErr) throw authErr

      // Also upsert profile with full_name
      // (handles cases where trigger doesn't capture metadata)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('profiles').upsert({
            id:         user.id,
            email:      user.email,
            full_name:  fullName.trim(),
            created_at: new Date().toISOString(),
          }, { onConflict: 'id' })
        }
      } catch {
        // Silent - profile sync is non-critical
      }

      setSuccess(true)
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  // ── Resend email ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true)
    const err = await resendConfirmation(email)
    setResending(false)
    if (!err) setResendSent(true)
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center
                      justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl
                          p-10 shadow-xl shadow-slate-100 space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full
                            flex items-center justify-center
                            mx-auto text-4xl">
              📧
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                Check Your Email!
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We sent a confirmation link to{' '}
                <span className="font-bold text-slate-700">{email}</span>.
                Click the link to activate your account.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200
                            rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs font-bold text-blue-800 uppercase
                            tracking-wide">
                What to do next:
              </p>
              {[
                '1. Open your email inbox',
                '2. Click the confirmation link',
                '3. Return here and sign in',
                '4. Start your bar exam prep!',
              ].map(step => (
                <p key={step} className="text-xs text-blue-700">{step}</p>
              ))}
            </div>

            {/* Go to login — passes from state */}
            <Link
              to="/login"
              state={{ from }}
              className="block w-full py-4 bg-blue-600 text-white
                         font-black text-base rounded-2xl
                         hover:bg-blue-700 transition-all
                         hover:-translate-y-0.5 text-center"
            >
              Go to Login →
            </Link>

            {/* Resend */}
            <p className="text-xs text-slate-400">
              Didn't receive it? Check spam or{' '}
              {resendSent ? (
                <span className="text-green-600 font-semibold">
                  ✅ Email resent!
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-blue-600 hover:underline font-semibold
                             disabled:opacity-60"
                >
                  {resending ? 'Sending…' : 'resend confirmation'}
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Signup form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center
                    justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">

        {/* ── Header ── */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center
                                   justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl
                            flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-black text-slate-900 text-xl">
              BarPrep <span className="text-blue-600">AI</span>
            </span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900">
            Start studying smarter
          </h1>
          <p className="text-slate-500 text-sm">
            Create your free account — no credit card required
          </p>
        </div>

        {/* ── Free plan badge ── */}
        <div className="bg-green-50 border border-green-200
                        rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-bold text-green-800">
              Free Plan Included
            </p>
            <p className="text-xs text-green-600">
              AI coaching + mock exams + blog access — forever free.
              Upgrade anytime.
            </p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="bg-white border border-slate-200 rounded-3xl
                        p-8 shadow-xl shadow-slate-100 space-y-6">

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200
                            rounded-2xl flex items-start gap-3">
              <span className="text-red-500 text-lg shrink-0">❌</span>
              <div>
                <p className="text-red-800 text-sm font-semibold">
                  Please fix the following
                </p>
                <p className="text-red-600 text-xs mt-0.5">{error}</p>
                {/* If email already exists, offer to go to login */}
                {error.includes('already exists') && (
                  <Link
                    to="/login"
                    state={{ from }}
                    className="mt-2 inline-block text-xs font-bold
                               text-blue-600 hover:underline"
                  >
                    Sign in instead →
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5" noValidate>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500
                                 uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => { setFullName(e.target.value); clearError() }}
                placeholder="John Smith"
                required
                disabled={loading}
                autoComplete="name"
                className="w-full px-4 py-3.5 bg-slate-50 border
                           border-slate-200 rounded-2xl text-sm
                           text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500 focus:border-transparent
                           transition-all disabled:opacity-60"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500
                                 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError() }}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
                className="w-full px-4 py-3.5 bg-slate-50 border
                           border-slate-200 rounded-2xl text-sm
                           text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500 focus:border-transparent
                           transition-all disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500
                                 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError() }}
                  placeholder="Min. 6 characters"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 bg-slate-50 border
                             border-slate-200 rounded-2xl text-sm
                             text-slate-900 placeholder-slate-400
                             focus:outline-none focus:ring-2
                             focus:ring-blue-500 focus:border-transparent
                             transition-all disabled:opacity-60 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600
                             transition-colors text-sm"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Strength meter */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all
                          duration-300
                          ${i <= strength.score
                            ? strength.color
                            : 'bg-slate-200'
                          }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className={`text-[10px] font-bold
                      ${strength.score <= 1 ? 'text-red-500'
                        : strength.score === 2 ? 'text-amber-500'
                        : strength.score === 3 ? 'text-blue-500'
                        : 'text-green-500'
                      }`}>
                      Password strength: {strength.label}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Tip: Use uppercase, numbers, and symbols for a strong password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500
                                 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={e => { setConfirmPass(e.target.value); clearError() }}
                  placeholder="Repeat your password"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className={`
                    w-full px-4 py-3.5 bg-slate-50 border rounded-2xl
                    text-sm text-slate-900 placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:border-transparent
                    transition-all disabled:opacity-60 pr-12
                    ${confirmPass && password !== confirmPass
                      ? 'border-red-300 focus:ring-red-400'
                      : confirmPass && password === confirmPass
                        ? 'border-green-300 focus:ring-green-400'
                        : 'border-slate-200 focus:ring-blue-500'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600
                             transition-colors text-sm"
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
                {confirmPass && (
                  <span className="absolute right-10 top-1/2
                                   -translate-y-1/2 text-sm">
                    {password === confirmPass ? '✅' : '❌'}
                  </span>
                )}
              </div>
              {confirmPass && password !== confirmPass && (
                <p className="text-[10px] text-red-500 font-semibold">
                  Passwords do not match
                </p>
              )}
              {confirmPass && password === confirmPass && password && (
                <p className="text-[10px] text-green-600 font-semibold">
                  ✓ Passwords match
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 p-4 bg-slate-50
                            border border-slate-200 rounded-2xl">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={e => { setAgreed(e.target.checked); clearError() }}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded
                           border-slate-300 focus:ring-blue-500
                           cursor-pointer shrink-0"
              />
              <label
                htmlFor="agree"
                className="text-xs text-slate-600 leading-relaxed cursor-pointer"
              >
                I agree to the{' '}
                <Link to="/terms" target="_blank"
                      className="text-blue-600 hover:underline font-semibold">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank"
                      className="text-blue-600 hover:underline font-semibold">
                  Privacy Policy
                </Link>
                . I understand BarPrep AI is an educational tool and not
                a substitute for accredited bar prep courses.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                loading ||
                !email.trim() || !password || !confirmPass ||
                !agreed || password !== confirmPass
              }
              className="w-full py-4 bg-blue-600 text-white font-black
                         text-base rounded-2xl hover:bg-blue-700
                         transition-all duration-200 shadow-lg
                         shadow-blue-200 hover:-translate-y-0.5
                         active:scale-[0.98] disabled:opacity-60
                         disabled:cursor-not-allowed
                         disabled:hover:translate-y-0
                         flex items-center justify-center gap-2"
            >
              {loading
                ? <><LoadingSpinner size="sm" color="white" /> Creating Account…</>
                : 'Create Free Account →'
              }
            </button>

          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400 font-medium">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login link */}
          <Link
            to="/login"
            state={{ from }}
            className="block w-full py-4 border-2 border-slate-200
                       text-slate-700 font-black text-base rounded-2xl
                       hover:border-blue-300 hover:text-blue-600
                       hover:bg-blue-50 transition-all duration-200
                       text-center"
          >
            Sign In Instead
          </Link>

        </div>

        {/* ── What you get ── */}
        <div className="bg-white border border-slate-200 rounded-2xl
                        p-5 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase
                        tracking-wide text-center">
            What you get for free
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🤖', text: 'AI Coach' },
              { icon: '📝', text: 'Mock Exams'     },
              { icon: '📊', text: 'Progress Tracking' },
              { icon: '🎥', text: 'Video Tutorials' },
              { icon: '📰', text: 'Blog Access' },  // ← NEW
              { icon: '📅', text: 'Study Planning'  },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl"
              >
                <span className="text-base">{icon}</span>
                <span className="text-xs text-slate-600 font-medium">{text}</span>
              </div>
            ))}
          </div>
          <div className="text-center pt-1">
            <a
              href="/#pricing"
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              See Pro plan ($90/mo) →
            </a>
          </div>
        </div>

        {/* ── Trust signals ── */}
        <div className="flex items-center justify-center gap-6
                        flex-wrap text-slate-400 text-xs">
          {[
            '🔒 Secure & encrypted',
            '✅ No credit card',
            '⚡ Cancel anytime',
          ].map(t => (
            <span key={t} className="font-medium">{t}</span>
          ))}
        </div>

        {/* ── Back to home ── */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-slate-600
                       transition-colors font-medium"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  )
}
