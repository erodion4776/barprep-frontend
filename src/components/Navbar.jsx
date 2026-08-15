import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate }   from 'react-router-dom'
import { supabase }                         from '../api/client'
import { useSubscription }                  from '../context/SubscriptionContext'

const NAV_LINKS = [
  { to: '/',          label: 'Home',       auth: false },
  { to: '/home',      label: 'Dashboard',  auth: true  },
  { to: '/chat',      label: 'AI Coach',   auth: true  },
  { to: '/tutorials', label: 'Tutorials',  auth: false },
  { to: '/study',     label: 'Study',      auth: true  },
  { to: '/mock-exam', label: 'Mock Exam',  auth: true  },
  { to: '/blog',      label: 'Blog',       auth: false },
]

function getInitials(email = '') {
  return email.slice(0, 2).toUpperCase()
}

async function syncProfile(u) {
  if (!u) return
  try {
    await supabase.from('profiles').upsert({
      id:         u.id,
      email:      u.email,
      created_at: u.created_at || new Date().toISOString(),
    }, { onConflict: 'id' })
  } catch (err) {
    console.warn('Silent profile sync issue:', err)
  }
}

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()

  const { plan, isFree } = useSubscription()

  const [menuOpen,     setMenuOpen]     = useState(false)
  const [user,         setUser]         = useState(null)
  const [isAdmin,      setIsAdmin]      = useState(false)
  const [scrolled,     setScrolled]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // ── Scroll shadow ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Close menus on route change ────────────────────────────────────────────
  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  // ── Auth state ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      checkAdmin(u)
      if (u) syncProfile(u)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        checkAdmin(u)
        if (u) syncProfile(u)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const checkAdmin = useCallback((u) => {
    if (!u) { setIsAdmin(false); return }
    const adminFlag = u.user_metadata?.is_admin
    setIsAdmin(!!adminFlag)
  }, [])

  // ── Sign out ───────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setMenuOpen(false)
    setUserMenuOpen(false)
    navigate('/')
  }, [navigate])

  // ── Active check ───────────────────────────────────────────────────────────
  const isActive = (to) => {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  // ── Filter nav links based on auth ─────────────────────────────────────────
  const visibleLinks = NAV_LINKS.filter(link => {
    // Always show non-auth links
    if (!link.auth) return true
    // Only show auth links if user is logged in
    return !!user
  })

  // ── Plan badge config ──────────────────────────────────────────────────────
  const planBadge = {
    free:     { label: 'Free Plan',    bg: 'bg-slate-100',  text: 'text-slate-600'  },
    pro:      { label: '🔥 Pro Plan',  bg: 'bg-blue-100',   text: 'text-blue-700'   },
    barready: { label: '👑 Bar Ready', bg: 'bg-purple-100', text: 'text-purple-700' },
  }[plan] || { label: 'Free Plan', bg: 'bg-slate-100', text: 'text-slate-600' }

  return (
    <nav
      className={`
        bg-white sticky top-0 z-50 border-b border-slate-200
        transition-shadow duration-200
        ${scrolled ? 'shadow-md' : 'shadow-none'}
      `}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link
            to={user ? '/home' : '/'}
            className="flex items-center gap-2 shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg
                            flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">
              BarPrep <span className="text-blue-600">AI</span>
            </span>
          </Link>

          {/* ── Desktop Links ── */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${isActive(to)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
              >
                {label}
              </Link>
            ))}

            {/* Pricing link */}
            <Link
              to="/pricing"
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive('/pricing')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-blue-600 hover:bg-blue-50'
                }
              `}
            >
              ⭐ Pricing
            </Link>

            {/* Admin link */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive('/admin')
                    ? 'bg-amber-50 text-amber-600'
                    : 'text-amber-600 hover:bg-amber-50'
                  }
                `}
              >
                ⚙ Admin
              </Link>
            )}

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* ── Auth Block ── */}
            {user ? (
              <div className="relative">
                {/* Avatar button */}
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1
                             rounded-full border border-slate-200
                             hover:border-slate-300 hover:bg-slate-50
                             transition-all duration-200"
                >
                  <div className="w-7 h-7 bg-blue-600 rounded-full
                                  flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {getInitials(user.email)}
                    </span>
                  </div>
                  <span className="text-sm text-slate-600 max-w-[100px] truncate">
                    {user.email}
                  </span>
                  <span className="text-slate-400 text-xs">▾</span>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />

                    <div className="absolute right-0 top-full mt-2 w-64
                                    bg-white border border-slate-200 rounded-xl
                                    shadow-lg py-1 z-50">

                      {/* User info + plan badge */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1
                                           rounded-full ${planBadge.bg} ${planBadge.text}`}>
                            {planBadge.label}
                          </span>
                          {isFree && (
                            <Link
                              to="/pricing"
                              onClick={() => setUserMenuOpen(false)}
                              className="text-[10px] text-blue-600 hover:underline font-bold"
                            >
                              Upgrade →
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Menu links */}
                      <Link
                        to="/home"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-600
                                   hover:bg-slate-50 transition-colors"
                      >
                        📊 Dashboard
                      </Link>
                      <Link
                        to="/chat"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-600
                                   hover:bg-slate-50 transition-colors"
                      >
                        💬 AI Coach
                      </Link>
                      <Link
                        to="/mock-exam"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-600
                                   hover:bg-slate-50 transition-colors"
                      >
                        📝 Mock Exam
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-600
                                   hover:bg-slate-50 transition-colors"
                      >
                        ⚙ Settings
                      </Link>
                      <Link
                        to="/pricing"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-600
                                   hover:bg-slate-50 transition-colors"
                      >
                        ⭐ {isFree ? 'Upgrade Plan' : 'Manage Plan'}
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-amber-600
                                     hover:bg-amber-50 transition-colors"
                        >
                          ⚙ Admin Dashboard
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-sm
                                   text-red-600 hover:bg-red-50 transition-colors"
                      >
                        → Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600
                             hover:text-slate-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-bold bg-blue-600
                             text-white rounded-lg hover:bg-blue-700
                             transition-colors"
                >
                  Sign up free
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600
                       hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg
              className="w-6 h-6 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`
          md:hidden border-t border-slate-100 bg-white
          overflow-hidden transition-all duration-300 ease-in-out
          ${menuOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 py-3 space-y-1">

          {/* Nav links */}
          {visibleLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`
                block px-4 py-3 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${isActive(to)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              {label}
            </Link>
          ))}

          {/* Pricing */}
          <Link
            to="/pricing"
            className={`
              block px-4 py-3 rounded-lg text-sm font-medium
              transition-colors duration-200
              ${isActive('/pricing')
                ? 'bg-blue-50 text-blue-600'
                : 'text-blue-600 hover:bg-blue-50'
              }
            `}
          >
            ⭐ Pricing
          </Link>

          {/* Admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="block px-4 py-3 rounded-lg text-sm font-medium
                         text-amber-600 hover:bg-amber-50 transition-colors"
            >
              ⚙ Admin
            </Link>
          )}

          {/* Mobile auth */}
          {user ? (
            <div className="border-t border-slate-100 pt-3 mt-2 space-y-1">

              {/* Avatar + info */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full
                                flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">
                    {getInitials(user.email)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5
                                     rounded-full ${planBadge.bg} ${planBadge.text}`}>
                      {planBadge.label}
                    </span>
                    {isFree && (
                      <Link
                        to="/pricing"
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        Upgrade →
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile menu links */}
              <Link
                to="/home"
                className="block px-4 py-3 text-sm text-slate-600
                           hover:bg-slate-100 rounded-lg transition-colors"
              >
                📊 Dashboard
              </Link>
              <Link
                to="/settings"
                className="block px-4 py-3 text-sm text-slate-600
                           hover:bg-slate-100 rounded-lg transition-colors"
              >
                ⚙ Settings
              </Link>
              <Link
                to="/pricing"
                className="block px-4 py-3 text-sm text-slate-600
                           hover:bg-slate-100 rounded-lg transition-colors"
              >
                ⭐ {isFree ? 'Upgrade Plan' : 'Manage Plan'}
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 text-sm font-medium
                           text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                → Sign Out
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
              <Link
                to="/login"
                className="block px-4 py-3 text-sm font-medium
                           text-slate-600 hover:bg-slate-100
                           rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="block px-4 py-3 text-sm font-bold
                           text-blue-600 hover:bg-blue-50
                           rounded-lg transition-colors"
              >
                Sign up free →
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
