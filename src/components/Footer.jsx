import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

export default function Footer() {
  const year     = new Date().getFullYear()
  const location = useLocation()
  const [email,        setEmail]        = useState('')
  const [subscribed,   setSubscribed]   = useState(false)
  const [subscribing,  setSubscribing]  = useState(false)

  const links = {
    Product: [
      { to: '/',          label: 'Home'         },
      { to: '/chat',      label: 'AI Coach'     },
      { to: '/mock-exam', label: 'Mock Exam'    },
      { to: '/tutorials', label: 'Tutorials'    },
      { to: '/study',     label: 'Study Center' },
      { to: '/blog',      label: 'Blog'         }, // ← NEW
    ],
    Support: [
      { to: '/faq',     label: 'FAQ'        },
      { to: '/contact', label: 'Contact Us' },
      { to: '/about',   label: 'About Us'   },
    ],
    Legal: [
      { to: '/privacy',    label: 'Privacy Policy'   },
      { to: '/terms',      label: 'Terms of Service' },
      { to: '/cookies',    label: 'Cookie Policy'    },
      { to: '/disclaimer', label: 'Disclaimer'       },
    ],
  }

  const socials = [
    {
      label: 'Twitter / X',
      href:  'https://twitter.com/barprepai',
      icon:  '𝕏',
    },
    {
      label: 'LinkedIn',
      href:  'https://linkedin.com/company/barprepai',
      icon:  'in',
    },
  ]

  const handleCookieReset = () => {
    localStorage.removeItem('cookie_consent')
    localStorage.removeItem('cookie_consent_date')
    // Dispatch custom event so banner re-appears without page reload
    window.dispatchEvent(new Event('cookie_consent_reset'))
    // Fallback: reload after short delay
    setTimeout(() => window.location.reload(), 100)
  }

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email) return
    setSubscribing(true)
    try {
      // TODO: wire to your Supabase edge function
      await new Promise(r => setTimeout(r, 1000)) // placeholder
      setSubscribed(true)
      setEmail('')
    } catch {
      // silent fail for now
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <footer className="bg-slate-900 text-slate-400 mt-16 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Top Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">

          {/* Brand Block — spans 2 cols on lg */}
          <div className="lg:col-span-2 space-y-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 w-fit">
              <div className="w-8 h-8 bg-blue-600 rounded-lg
                              flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-white text-lg">
                BarPrep <span className="text-blue-400">AI</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-xs">
              Your personal AI-powered bar exam coach.
              Study smarter, practice harder, pass with confidence.
            </p>

            {/* Disclaimer */}
            <div className="bg-amber-900/30 border border-amber-700/30
                            rounded-lg p-3">
              <p className="text-[10px] text-amber-400 font-medium leading-relaxed">
                ⚠️ <span className="font-bold">Disclaimer:</span> BarPrep AI
                is an educational tool. It is not a substitute for licensed
                legal advice or accredited bar prep courses.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-1">
              {socials.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700
                             border border-slate-700 rounded-lg
                             flex items-center justify-center
                             text-xs font-bold text-slate-400
                             hover:text-white transition-all duration-200"
                >
                  {icon}
                </a>
              ))}

              {/* System Status Badge */}
              <div className="flex items-center gap-1.5 ml-2
                              bg-slate-800 border border-slate-700
                              rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full
                                  animate-pulse" />
                <span className="text-[10px] text-slate-400">
                  All systems normal
                </span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-white mb-2">
                📬 Get weekly bar prep tips
              </p>
              {subscribed ? (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  ✅ You're subscribed! Check your inbox.
                </p>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-slate-800 border border-slate-700
                               rounded-lg px-3 py-1.5 text-xs text-white
                               placeholder-slate-500
                               focus:outline-none focus:border-blue-500
                               transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700
                               text-white text-xs font-bold rounded-lg
                               transition-colors disabled:opacity-60
                               whitespace-nowrap"
                  >
                    {subscribing ? '...' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ── Link Groups ── */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-white font-bold text-sm uppercase
                             tracking-wider mb-4">
                {group}
              </h3>
              <ul className="space-y-2.5">
                {items.map(({ to, label }) => {
                  const isActive = location.pathname === to
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        className={`
                          text-sm transition-colors flex items-center gap-1.5
                          ${isActive
                            ? 'text-blue-400 font-medium'
                            : 'hover:text-white'
                          }
                        `}
                      >
                        {isActive && (
                          <span className="w-1 h-1 bg-blue-400 rounded-full" />
                        )}
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom Bar ── */}
        <div className="border-t border-slate-800 pt-6">
          <div className="flex flex-col sm:flex-row items-center
                          justify-between gap-4">

            <p className="text-xs text-slate-500 text-center sm:text-left">
              © {year} BarPrep AI. All rights reserved.
              Not affiliated with the National Conference of Bar Examiners (NCBE).
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                { to: '/privacy', label: 'Privacy'  },
                { to: '/terms',   label: 'Terms'    },
                { to: '/cookies', label: 'Cookies'  },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-xs hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}

              {/* Cookie Reset — no page reload */}
              <button
                onClick={handleCookieReset}
                className="text-xs hover:text-white transition-colors underline"
              >
                Cookie Settings
              </button>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
