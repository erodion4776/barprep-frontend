import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)
  const navigate                = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error

      // ── Redirect to dashboard after login ──────────────────
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center
                    justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          {/* Logo */}
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
            Welcome back
          </h1>
          <p className="text-slate-500 text-sm">
            Sign in to continue your bar exam preparation
          </p>
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
                  Login Failed
                </p>
                <p className="text-red-600 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold
                                  text-slate-500 uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // Placeholder for forgot password
                    alert('Please contact support to reset your password.')
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800
                             font-semibold transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-4 bg-blue-600 text-white font-black
                         text-base rounded-2xl hover:bg-blue-700
                         transition-all duration-200 shadow-lg
                         shadow-blue-200 hover:-translate-y-0.5
                         active:scale-[0.98] disabled:opacity-60
                         disabled:cursor-not-allowed
                         disabled:hover:translate-y-0
                         flex items-center justify-center gap-2">
              {loading
                ? <><LoadingSpinner size="sm" /> Signing in...</>
                : 'Sign In →'}
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

          {/* Sign up link */}
          <Link
            to="/signup"
            className="block w-full py-4 border-2 border-slate-200
                       text-slate-700 font-black text-base rounded-2xl
                       hover:border-blue-300 hover:text-blue-600
                       hover:bg-blue-50 transition-all duration-200
                       text-center">
            Create Free Account
          </Link>

        </div>

        {/* ── Trust Signals ───────────────────────────────────── */}
        <div className="flex items-center justify-center gap-6
                        flex-wrap text-slate-400 text-xs">
          {[
            '🔒 Secure login',
            '✅ Free plan available',
            '⚡ 24/7 AI access',
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
