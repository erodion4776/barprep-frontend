import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

// ─── Consent helpers (importable by rest of app) ─────────────────────────────
const CONSENT_KEY    = 'cookie_consent'
const CONSENT_DATE   = 'cookie_consent_date'
const CONSENT_EXPIRY = 365 * 24 * 60 * 60 * 1000 // 1 year

export function getConsent() {
  try {
    const raw  = localStorage.getItem(CONSENT_KEY)
    const date = localStorage.getItem(CONSENT_DATE)
    if (!raw || !date) return null
    if (Date.now() - new Date(date).getTime() > CONSENT_EXPIRY) {
      localStorage.removeItem(CONSENT_KEY)
      localStorage.removeItem(CONSENT_DATE)
      return null
    }
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function hasConsent(type) {
  const c = getConsent()
  return c ? !!c[type] : false
}

// ─── Cookie definitions ───────────────────────────────────────────────────────
const COOKIES = [
  {
    id:       'essential',
    name:     '✅ Essential Cookies',
    desc:     'Required for login and app functionality. Cannot be disabled.',
    required: true,
  },
  {
    id:       'analytics',
    name:     '📊 Analytics Cookies',
    desc:     'Help us understand how you use the app to improve it.',
    required: false,
  },
  {
    id:       'ai_session',
    name:     '🤖 AI Session Cookies',
    desc:     'Store your chat and study session data locally for continuity.',
    required: false,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function CookieBanner() {
  const [visible,      setVisible]      = useState(false)
  const [showDetails,  setShowDetails]  = useState(false)
  const [dismissing,   setDismissing]   = useState(false)
  const [prefs, setPrefs] = useState({
    essential:  true,   // always true
    analytics:  false,
    ai_session: false,
  })

  useEffect(() => {
    const existing = getConsent()
    if (!existing) {
      // Small delay so banner slides up after page load
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const saveConsent = useCallback((consentPrefs) => {
    localStorage.setItem(CONSENT_KEY,  JSON.stringify(consentPrefs))
    localStorage.setItem(CONSENT_DATE, new Date().toISOString())
    setDismissing(true)
    setTimeout(() => setVisible(false), 400)
  }, [])

  const acceptAll = () => saveConsent({
    essential:  true,
    analytics:  true,
    ai_session: true,
  })

  const acceptNecessary = () => saveConsent({
    essential:  true,
    analytics:  false,
    ai_session: false,
  })

  const acceptCustom = () => saveConsent(prefs)

  const togglePref = (id) => {
    if (id === 'essential') return // can't toggle required
    setPrefs(p => ({ ...p, [id]: !p[id] }))
  }

  if (!visible) return null

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-[9999]
        bg-slate-900 text-white shadow-2xl border-t border-slate-700
        transition-transform duration-400 ease-in-out
        ${dismissing ? 'translate-y-full' : 'translate-y-0'}
      `}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">

        {/* ── Main Row ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* Left: Text */}
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl shrink-0">🍪</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                We use cookies to improve your experience
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                We use essential cookies for authentication and optional cookies
                to improve our service.{' '}
                <Link
                  to="/cookies"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Learn more
                </Link>
              </p>

              {/* Toggle details */}
              <button
                onClick={() => setShowDetails(s => !s)}
                className="text-[11px] text-blue-400 hover:text-blue-300
                           underline mt-1 transition-colors"
              >
                {showDetails ? '▲ Hide details' : '▼ Customize cookies'}
              </button>

              {/* ── Detail Rows ── */}
              {showDetails && (
                <div className="mt-3 space-y-2">
                  {COOKIES.map(({ id, name, desc, required }) => (
                    <div
                      key={id}
                      className="flex items-start gap-3 p-2
                                 bg-slate-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                      </div>

                      {required ? (
                        <span className="text-[10px] bg-slate-600 text-slate-300
                                         px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                          Required
                        </span>
                      ) : (
                        /* Toggle switch */
                        <button
                          onClick={() => togglePref(id)}
                          className={`
                            relative shrink-0 mt-0.5 w-9 h-5 rounded-full
                            transition-colors duration-200
                            ${prefs[id] ? 'bg-blue-600' : 'bg-slate-600'}
                          `}
                          aria-label={`Toggle ${name}`}
                          role="switch"
                          aria-checked={prefs[id]}
                        >
                          <span
                            className={`
                              absolute top-0.5 left-0.5 w-4 h-4 bg-white
                              rounded-full shadow transition-transform duration-200
                              ${prefs[id] ? 'translate-x-4' : 'translate-x-0'}
                            `}
                          />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Save custom */}
                  <button
                    onClick={acceptCustom}
                    className="w-full mt-1 py-1.5 text-xs font-medium
                               border border-slate-600 text-slate-300 rounded-lg
                               hover:bg-slate-700 transition-colors"
                  >
                    Save my preferences
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={acceptNecessary}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium
                         border border-slate-600 text-slate-300 rounded-lg
                         hover:bg-slate-800 transition-colors"
            >
              Necessary Only
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none px-6 py-2 text-sm font-bold
                         bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>

        {/* Expiry note */}
        <p className="text-[10px] text-slate-600 mt-2 text-center">
          Your preference will be remembered for 1 year.
          You can change it anytime in{' '}
          <Link to="/settings" className="underline hover:text-slate-400">
            Settings
          </Link>.
        </p>
      </div>
    </div>
  )
}
