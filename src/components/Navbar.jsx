import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../api/client'

const links = [
  { to: '/',          label: 'Home'      },
  { to: '/chat',      label: 'AI Coach'  },
  { to: '/tutorials', label: 'Tutorials' },
  { to: '/study',     label: 'Study'     },
  { to: '/mock-exam', label: 'Mock Exam' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)

  const syncProfile = async (u) => {
    if (!u) return
    try {
      await supabase.from('profiles').upsert({
        id: u.id,
        email: u.email,
        created_at: u.created_at || new Date().toISOString()
      }, { onConflict: 'id' })
    } catch (err) {
      console.warn('Silent profile sync issue (table/policy might not be ready yet):', err)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        syncProfile(currentUser)
      }
    })

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        syncProfile(currentUser)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    window.location.reload()
  }

  return (
    <nav className="bg-white border-b border-slate-200
                    sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg
                            flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">
              BarPrep <span className="text-blue-600">AI</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${pathname === to
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                {label}
              </Link>
            ))}
            <div className="h-6 w-px bg-slate-200 mx-2" />
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600 max-w-[150px] truncate" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary text-sm !py-1.5"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Login</Link>
                <Link to="/signup" className="btn-primary">Sign up</Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-slate-600
                       hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-100
                        bg-white px-4 py-3 space-y-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm
                font-medium transition-colors duration-200
                ${pathname === to
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <div className="border-t border-slate-100 pt-3 mt-2 space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-slate-400 truncate">
                {user.email}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left block px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Login</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
