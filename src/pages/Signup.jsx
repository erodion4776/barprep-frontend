import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Signup() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [fullName, setFullName]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [showPass, setShowPass]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed]         = useState(false)
  const navigate                    = useNavigate()

  // ── Password strength ────────────────────────────────────────
  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' }
    let score = 0
    if (pass.length >= 8)          score++
    if (/[A-Z]/.test(pass))        score++
    if (/[0-9]/.test(pass))        score++
    if (/[^A-Za-z0-9]/.test(pass)) score++

    const map = {
      0: { label: '',         color: 'bg-slate-200' },
      1: { label: 'Weak',     color: 'bg-red-500'   },
      2: { label: 'Fair',     color: 'bg-amber-500' },
      3: { label: 'Good',     color: 'bg-blue-500'  },
      4: { label: 'Strong',   color: 'bg-green-500' },
    }
    return { score, ...map[score] }
  }

  const strength = getStrength(password)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    // ── Validation ──────────────────────────────────────────
    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPass) {
      setError('Passwords do not match.')
      return
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email:    email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() }
        }
      })
      if (error) throw error

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success Screen ───────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center
                      justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="bg-white border border-slate-200
                          rounded-3xl p-10 shadow-xl
                          shadow-slate-100 space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full
                            flex items-center justify-center
                            mx-auto text-4xl">
              ✅
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                Check Your Email!
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We sent a confirmation link to{' '}
                <span className="font-bold text-slate-700">
                  {email}
                </span>
                . Click the link to activate your account.
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
                <p key={step} className="text-xs text-blue-700">
                  {step}
                </p>
              ))}
            </div>
            <Link
              to="/login"
              className="block w-full py-4 bg-blue-600 text-white
                         font-black text-base rounded-2xl
                         hover:bg-blue-700 transition-all
                         hover:-translate-y-0.5 text-center">
              Go to Login →
            </Link>
            <p className="text-xs text-slate-400">
              Didn't receive it? Check your spam folder or{' '}
              <button
                onClick={() => setSuccess(false)}
                className="text-blue-600 hover:underline font-semibold">
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center
                    justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center
                                   justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl
                            flex items-center justify-center
                            shadow-lg">
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

        {/* ── Free Plan Badge ─────────────────────────────────── */}
        <div className="bg-green-50 border border-green-200
                        rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-bold text-green-800">
              Free Plan Included
            </p>
            <p className="text-xs text-green-600">
              10 AI messages/day + 5 mock questions/day — forever free.
              Upgrade anytime.
            </p>
          </div>
        </div>

        {/* ── Card ───────────────────────────────────────────── */}
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
              </div>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">

            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-xs font-bold
                                text-slate-500 uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                required
                disabled={loading}
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
              <label className="block text-xs font-bold
                                text-slate-500 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
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
              <label className="block text-xs font-bold
                                text-slate-500 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-slate-50 border
                             border-slate-200 rounded-2xl text-sm
                             text-slate-900 placeholder-slate-400
                             focus:outline-none focus:ring-2
                             focus:ring-blue-500 focus:border-transparent
                             transition-all disabled:opacity-60 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600
                             transition-colors text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i}
                        className={`h-1.5 flex-1 rounded-full
                          transition-all duration-300
                          ${i <= strength.score
                            ? strength.color
                            : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] font-bold
                    ${strength.score <= 1 ? 'text-red-500'
                      : strength.score === 2 ? 'text-amber-500'
                      : strength.score === 3 ? 'text-blue-500'
                      : 'text-green-500'}`}>
                    {strength.label
                      ? `Password strength: ${strength.label}`
                      : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-xs font-bold
                                text-slate-500 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  disabled={loading}
                  className={`w-full px-4 py-3.5 bg-slate-50 border
                             rounded-2xl text-sm text-slate-900
                             placeholder-slate-400 focus:outline-none
                             focus:ring-2 focus:border-transparent
                             transition-all disabled:opacity-60 pr-12
                             ${confirmPass && password !== confirmPass
                               ? 'border-red-300 focus:ring-red-400'
                               : confirmPass && password === confirmPass
                                 ? 'border-green-300 focus:ring-green-400'
                                 : 'border-slate-200 focus:ring-blue-500'
                             }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600
                             transition-colors text-sm">
                  {showConfirm ? '🙈' : '👁️'}
                </button>
                {confirmPass && (
                  <div className="absolute right-10 top-1/2
                                  -translate-y-1/2 text-sm">
                    {password === confirmPass ? '✅' : '❌'}
                  </div>
                )}
              </div>
              {confirmPass && password !== confirmPass && (
                <p className="text-[10px] text-red-500 font-semibold">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 p-4 bg-slate-50
                            border border-slate-200 rounded-2xl">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded
                           border-slate-300 focus:ring-blue-500
                           cursor-pointer shrink-0"
              />
              <label htmlFor="agree"
                className="text-xs text-slate-600 leading-relaxed
                           cursor-pointer">
                I agree to the{' '}
                <Link to="/terms"
                  target="_blank"
                  className="text-blue-600 hover:underline font-semibold">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy"
                  target="_blank"
                  className="text-blue-600 hover:underline font-semibold">
                  Privacy Policy
                </Link>
                . I understand BarPrep AI is an educational tool and
                not a substitute for accredited bar prep courses.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                loading || !email || !password ||
                !confirmPass || !agreed ||
                password !== confirmPass
              }
              className="w-full py-4 bg-blue-600 text-white font-black
                         text-base rounded-2xl hover:bg-blue-700
                         transition-all duration-200 shadow-lg
                         shadow-blue-200 hover:-translate-y-0.5
                         active:scale-[0.98] disabled:opacity-60
                         disabled:cursor-not-allowed
                         disabled:hover:translate-y-0
                         flex items-center justify-center gap-2">
              {loading
                ? <><LoadingSpinner size="sm" /> Creating Account...</>
                : 'Create Free Account →'}
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
            className="block w-full py-4 border-2 border-slate-200
                       text-slate-700 font-black text-base rounded-2xl
                       hover:border-blue-300 hover:text-blue-600
                       hover:bg-blue-50 transition-all duration-200
                       text-center">
            Sign In Instead
          </Link>

        </div>

        {/* ── What you get ────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl
                        p-5 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase
                        tracking-wide text-center">
            What you get for free
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🤖', text: 'AI Coach — 10 msg/day'    },
              { icon: '📝', text: 'Mock Exam — 5 q/day'      },
              { icon: '📊', text: 'Progress tracking'        },
              { icon: '🎥', text: 'Tutorial access'          },
            ].map(({ icon, text }) => (
              <div key={text}
                className="flex items-center gap-2 p-2 bg-slate-50
                           rounded-xl">
                <span className="text-base">{icon}</span>
                <span className="text-xs text-slate-600 font-medium">
                  {text}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center pt-1">
            <Link to="/#pricing"
              className="text-xs text-blue-600 hover:underline
                         font-semibold">
              See Pro plan ($90/mo) →
            </Link>
          </div>
        </div>

        {/* ── Trust signals ───────────────────────────────────── */}
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

        {/* ── Back to landing ─────────────────────────────────── */}
        <div className="text-center">
          <Link to="/"
            className="text-xs text-slate-400 hover:text-slate-600
                       transition-colors font-medium">
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  )
}
