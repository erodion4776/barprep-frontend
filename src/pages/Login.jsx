import { useState, useEffect }               from 'react'
import { Link, useNavigate, useLocation }     from 'react-router-dom'
import { supabase }                           from '../api/client'
import LoadingSpinner                         from '../components/LoadingSpinner'

// ── Error message mapper ──────────────────────────────────────────────────────
function friendlyError(msg = '') {
  if (msg.includes('Invalid login credentials'))
    return 'Incorrect email or password. Please try again.'
  if (msg.includes('Email not confirmed'))
    return 'Please check your email and confirm your account first.'
  if (msg.includes('Too many requests'))
    return 'Too many login attempts. Please wait a few minutes.'
  if (msg.includes('User not found'))
    return 'No account found with that email. Please sign up first.'
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error. Please check your connection.'
  return msg || 'Login failed. Please try again.'
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const from       = location.state?.from    || '/chat'
  const banMessage = location.state?.error   || ''
  const wasBanned  = location.state?.banned  || false

  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(banMessage)
  const [showPass,      setShowPass]      = useState(false)

  // Forgot password state
  const [showForgot,    setShowForgot]    = useState(false)
  const [forgotEmail,   setForgotEmail]   = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent,    setForgotSent]    = useState(false)
  const [forgotError,   setForgotError]   = useState('')

  // SEO
  useEffect(() => {
    document.title = 'Sign In — BarPrep AI'
  }, [])

  useEffect(() => {
    if (showForgot && email) setForgotEmail(email)
  }, [showForgot, email])

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      })
      if (authErr) throw authErr

      // Check if user is banned
      if (authData?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_active, ban_reason, full_name')
            .eq('id', authData.user.id)
            .single()

          if (profile?.is_active === false) {
            // Sign out immediately
            await supabase.auth.signOut()
            setError(
              profile.ban_reason ||
              'Your account has been deactivated. Contact support@barprepai.com'
            )
            setLoading(false)
            return
          }
        } catch {
          // Silent — login still works even if profile check fails
        }
      }

      navigate(from, { replace: true })

    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    setForgotError('')

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      )
      if (resetErr) throw resetErr
      setForgotSent(true)
    } catch (err) {
      setForgotError(err.message || 'Failed to send reset email.')
    } finally {
      setForgotLoading(false)
    }
  }

  // ── Forgot password screen ─────────────────────────────────────────────────
  if (showForgot) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">

          <div className="text-center space-y-3">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center
                              justify-center shadow-lg">
                <span className="text-white font-black text-lg">B</span>
              </div>
              <span className="font-black text-slate-900 text-xl">
                BarPrep <span className="text-blue-600">AI</span>
              </span>
            </Link>
            <h1 className="text-3xl font-black text-slate-900">Reset Password</h1>
            <p className="text-slate-500 text-sm">
              Enter your email and we'll send a reset link.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8
                          shadow-xl shadow-slate-100 space-y-6">

            {forgotSent ? (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">📧</div>
                <h2 className="text-lg font-bold text-slate-900">Check Your Email</h2>
                <p className="text-sm text-slate-500">
                  We sent a password reset link to{' '}
                  <strong className="text-slate-700">{forgotEmail}</strong>.
                  Check your spam folder if you don't see it.
                </p>
                <button
                  onClick={() => {
                    setShowForgot(false)
                    setForgotSent(false)
                    setForgotEmail('')
                  }}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl
                             hover:bg-blue-700 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl
                                  text-red-700 text-sm">
                    ❌ {forgotError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500
                                     uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200
                               rounded-2xl text-sm focus:outline-none focus:ring-2
                               focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="w-full py-4 bg-blue-600 text-white font-black text-base
                             rounded-2xl hover:bg-blue-700 transition-all
                             disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {forgotLoading
                    ? <><LoadingSpinner size="sm" color="white" /> Sending...</>
                    : 'Send Reset Link →'
                  }
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full py-3 border border-slate-200 text-slate-600
                             font-medium text-sm rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  ← Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Main login form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center
                            justify-center shadow-lg">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-black text-slate-900 text-xl">
              BarPrep <span className="text-blue-600">AI</span>
            </span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-sm">
            Sign in to continue your bar exam preparation
          </p>

          {/* Redirect-back notice */}
          {location.state?.from && !wasBanned && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl
                            px-4 py-2 text-xs text-blue-700 font-medium">
              Sign in to access {location.state.from}
            </div>
          )}
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-3xl
                        p-8 shadow-xl shadow-slate-100 space-y-6">

          {/* Banned user message */}
          {wasBanned && error && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl
                            flex items-start gap-3">
              <span className="text-2xl shrink-0">🚫</span>
              <div>
                <p className="text-red-800 text-sm font-bold">
                  Account Deactivated
                </p>
                <p className="text-red-600 text-xs mt-1 leading-relaxed">
                  {error}
                </p>
                <a
                  href="mailto:support@barprepai.com"
                  className="mt-2 inline-block text-xs text-blue-600 font-bold
                             hover:underline"
                >
                  Contact Support →
                </a>
              </div>
            </div>
          )}

          {/* Regular error */}
          {error && !wasBanned && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl
                            flex items-start gap-3">
              <span className="text-red-500 text-lg shrink-0">❌</span>
              <div>
                <p className="text-red-800 text-sm font-semibold">
                  Sign In Failed
                </p>
                <p className="text-red-600 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500
                                 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200
                           rounded-2xl text-sm text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-transparent transition-all disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-500
                                   uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-blue-600 hover:text-blue-800
                             font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200
                             rounded-2xl text-sm text-slate-900 placeholder-slate-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent transition-all disabled:opacity-60 pr-12"
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full py-4 bg-blue-600 text-white font-black text-base
                         rounded-2xl hover:bg-blue-700 transition-all duration-200
                         shadow-lg shadow-blue-200 hover:-translate-y-0.5
                         active:scale-[0.98] disabled:opacity-60
                         disabled:cursor-not-allowed disabled:hover:translate-y-0
                         flex items-center justify-center gap-2"
            >
              {loading
                ? <><LoadingSpinner size="sm" color="white" /> Signing in...</>
                : 'Sign In →'
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
                New to BarPrep AI?
              </span>
            </div>
          </div>

          {/* Sign up */}
          <Link
            to="/signup"
            state={{ from }}
            className="block w-full py-4 border-2 border-slate-200 text-slate-700
                       font-black text-base rounded-2xl hover:border-blue-300
                       hover:text-blue-600 hover:bg-blue-50 transition-all
                       duration-200 text-center"
          >
            Create Free Account
          </Link>

        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 flex-wrap
                        text-slate-400 text-xs">
          {[
            '🔒 Secure login',
            '✅ Free plan available',
            '⚡ 24/7 AI access',
          ].map(t => (
            <span key={t} className="font-medium">{t}</span>
          ))}
        </div>

        {/* Back to landing */}
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
