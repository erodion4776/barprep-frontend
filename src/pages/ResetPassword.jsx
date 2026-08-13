import { useState, useEffect } from 'react'
import { useNavigate, Link }   from 'react-router-dom'
import { supabase }            from '../api/client'
import LoadingSpinner          from '../components/LoadingSpinner'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password,    setPassword]    = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking,    setChecking]    = useState(true)

  useEffect(() => {
    document.title = 'Reset Password — BarPrep AI'

    // Supabase sends the user back with a session in the URL hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
      setChecking(false)
    })
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirmPass) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
      })
      if (updateErr) throw updateErr
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verifying reset link..." />
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center
                                   justify-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl
                            flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-black text-slate-900 text-xl">
              BarPrep <span className="text-blue-600">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">
            Set New Password
          </h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl
                        p-8 shadow-xl shadow-slate-100 space-y-5">

          {/* Success */}
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-lg font-bold text-slate-900">
                Password Updated!
              </h2>
              <p className="text-sm text-slate-500">
                Redirecting you to login in 3 seconds…
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-2.5 bg-blue-600 text-white
                           font-bold rounded-xl hover:bg-blue-700
                           transition-colors text-sm"
              >
                Go to Login →
              </Link>
            </div>
          ) : !validSession ? (
            /* Invalid session */
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">❌</div>
              <p className="text-sm text-red-600">{error}</p>
              <Link
                to="/login"
                className="inline-block text-sm text-blue-600
                           hover:underline font-medium"
              >
                Back to Login →
              </Link>
            </div>
          ) : (
            /* Reset form */
            <form onSubmit={handleReset} className="space-y-4">

              {error && (
                <div className="p-3 bg-red-50 border border-red-200
                                rounded-xl text-red-700 text-sm">
                  ❌ {error}
                </div>
              )}

              {/* New password */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500
                                   uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    className="w-full px-4 py-3.5 bg-slate-50 border
                               border-slate-200 rounded-2xl text-sm
                               focus:outline-none focus:ring-2
                               focus:ring-blue-500 focus:border-transparent
                               transition-all disabled:opacity-60 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2
                               text-slate-400 hover:text-slate-600
                               transition-colors text-sm"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500
                                   uppercase tracking-wide">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className={`
                    w-full px-4 py-3.5 bg-slate-50 border rounded-2xl
                    text-sm focus:outline-none focus:ring-2
                    focus:border-transparent transition-all disabled:opacity-60
                    ${confirmPass && password !== confirmPass
                      ? 'border-red-300 focus:ring-red-400'
                      : confirmPass && password === confirmPass
                        ? 'border-green-300 focus:ring-green-400'
                        : 'border-slate-200 focus:ring-blue-500'
                    }
                  `}
                />
                {confirmPass && password !== confirmPass && (
                  <p className="text-[10px] text-red-500 font-semibold">
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  loading || !password || !confirmPass ||
                  password !== confirmPass
                }
                className="w-full py-4 bg-blue-600 text-white font-black
                           text-base rounded-2xl hover:bg-blue-700
                           transition-all disabled:opacity-60
                           flex items-center justify-center gap-2"
              >
                {loading
                  ? <><LoadingSpinner size="sm" color="white" /> Updating…</>
                  : 'Update Password →'
                }
              </button>

            </form>
          )}
        </div>

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
