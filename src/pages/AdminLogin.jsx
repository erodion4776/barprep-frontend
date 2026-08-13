import { useState, useEffect } from 'react'
import { useNavigate, Link }   from 'react-router-dom'
import { apiClient }           from '../api/client'
import LoadingSpinner          from '../components/LoadingSpinner'

// ── Brute force config ────────────────────────────────────────────────────────
const MAX_ATTEMPTS    = 5
const LOCKOUT_MINUTES = 15
const LOCKOUT_MS      = LOCKOUT_MINUTES * 60 * 1000
const STORAGE_KEY     = 'admin_login_attempts'

function getAttemptData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, lockedUntil: null }
    return JSON.parse(raw)
  } catch {
    return { count: 0, lockedUntil: null }
  }
}

function saveAttemptData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function clearAttemptData() {
  localStorage.removeItem(STORAGE_KEY)
}

function isLockedOut() {
  const { lockedUntil } = getAttemptData()
  if (!lockedUntil) return false
  if (Date.now() < lockedUntil) return true
  clearAttemptData() // lockout expired
  return false
}

function getLockoutRemaining() {
  const { lockedUntil } = getAttemptData()
  if (!lockedUntil) return 0
  const ms = lockedUntil - Date.now()
  return Math.max(0, Math.ceil(ms / 60000)) // minutes
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminLogin() {
  const navigate = useNavigate()

  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [locked,      setLocked]      = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
  const [checking,    setChecking]    = useState(true)

  // ── On mount: check existing token + lockout ───────────────────────────────
  useEffect(() => {
    const check = async () => {
      // Already locked out?
      if (isLockedOut()) {
        setLocked(true)
        setChecking(false)
        return
      }

      // Already logged in?
      const token = localStorage.getItem('admin_token')
      if (token) {
        try {
          const res = await apiClient.adminVerify(token)
          if (res.data.valid) {
            navigate('/admin', { replace: true })
            return
          }
        } catch {
          localStorage.removeItem('admin_token')
        }
      }

      // Set remaining attempts display
      const { count } = getAttemptData()
      setAttemptsLeft(MAX_ATTEMPTS - count)
      setChecking(false)
    }
    check()
  }, [navigate])

  // ── Lockout countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!locked) return
    const interval = setInterval(() => {
      if (!isLockedOut()) {
        setLocked(false)
        setAttemptsLeft(MAX_ATTEMPTS)
        clearInterval(interval)
      }
    }, 30000) // check every 30s
    return () => clearInterval(interval)
  }, [locked])

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    if (locked) return

    setLoading(true)
    setError('')

    try {
      const res = await apiClient.adminLogin(password)
      if (res.data.token) {
        clearAttemptData()
        localStorage.setItem('admin_token', res.data.token)
        navigate('/admin', { replace: true })
      }
    } catch (err) {
      // Track failed attempt
      const data    = getAttemptData()
      const newCount = (data.count || 0) + 1

      if (newCount >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_MS
        saveAttemptData({ count: newCount, lockedUntil })
        setLocked(true)
        setError(
          `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`
        )
      } else {
        saveAttemptData({ count: newCount, lockedUntil: null })
        const remaining = MAX_ATTEMPTS - newCount
        setAttemptsLeft(remaining)

        // Differentiate error types
        const isNetworkError =
          !err.response && err.message?.toLowerCase().includes('network')
        setError(
          isNetworkError
            ? 'Network error — please check your connection and try again.'
            : `Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        )
      }

      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  // ── Loading check ──────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking session..." />
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200
                      rounded-2xl shadow-sm p-8 space-y-6">

        {/* ── Back to site ── */}
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-slate-400
                     hover:text-slate-600 transition-colors w-fit"
        >
          ← Back to site
        </Link>

        {/* ── Header ── */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl
                          flex items-center justify-center mx-auto
                          shadow-lg shadow-blue-600/20">
            <span className="text-white text-2xl font-bold">⚙</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Admin Access
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              BarPrep AI Admin Dashboard
            </p>
          </div>
        </div>

        {/* ── Locked state ── */}
        {locked ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200
                            rounded-xl text-center space-y-2">
              <p className="text-3xl">🔒</p>
              <p className="font-bold text-red-800">
                Account Temporarily Locked
              </p>
              <p className="text-sm text-red-700">
                Too many failed attempts.
                Locked for {getLockoutRemaining()} more minute
                {getLockoutRemaining() === 1 ? '' : 's'}.
              </p>
              <p className="text-xs text-red-500 mt-1">
                This page will unlock automatically.
              </p>
            </div>
          </div>
        ) : (
          /* ── Login form ── */
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium
                                 text-slate-700 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full border border-slate-200 rounded-xl
                             px-4 py-2.5 pr-12 text-sm
                             focus:outline-none focus:border-blue-500
                             transition-colors"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                {/* Show/hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600
                             transition-colors text-sm"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Attempts remaining indicator */}
            {attemptsLeft < MAX_ATTEMPTS && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors
                      ${i < attemptsLeft ? 'bg-amber-400' : 'bg-slate-200'}`}
                  />
                ))}
                <span className="text-xs text-amber-600 ml-1 whitespace-nowrap">
                  {attemptsLeft} left
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200
                              rounded-xl text-red-700 text-sm flex
                              items-start gap-2">
                <span className="shrink-0">❌</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-3 bg-blue-600 text-white font-bold
                         rounded-xl hover:bg-blue-700 transition-colors
                         disabled:opacity-60 flex items-center
                         justify-center gap-2 min-h-[48px]
                         shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  Verifying...
                </>
              ) : (
                'Login to Admin →'
              )}
            </button>
          </form>
        )}

        {/* ── Footer note ── */}
        <p className="text-center text-xs text-slate-400">
          This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  )
}
