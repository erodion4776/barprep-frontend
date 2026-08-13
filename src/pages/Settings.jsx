import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../api/client'

export default function Settings() {
  useEffect(() => {
    document.title = 'Settings — BarPrep AI'
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleCookieReset = () => {
    localStorage.removeItem('cookie_consent')
    localStorage.removeItem('cookie_consent_date')
    window.location.reload()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Account */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Account</h2>
        <div className="space-y-3">
          <Link
            to="/contact"
            className="block text-sm text-blue-600 hover:underline"
          >
            Request data export →
          </Link>
          <Link
            to="/contact"
            className="block text-sm text-blue-600 hover:underline"
          >
            Request account deletion →
          </Link>
        </div>
      </div>

      {/* Cookie preferences */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Cookie Preferences
        </h2>
        <button
          onClick={handleCookieReset}
          className="px-4 py-2 text-sm border border-slate-200
                     text-slate-600 rounded-xl hover:bg-slate-50
                     transition-colors"
        >
          🔄 Reset Cookie Preferences
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-red-900">Danger Zone</h2>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm bg-red-600 text-white font-bold
                     rounded-xl hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
