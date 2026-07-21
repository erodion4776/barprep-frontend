import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    localStorage.setItem('cookie_consent_date', new Date().toISOString())
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    localStorage.setItem('cookie_consent_date', new Date().toISOString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999]
                    bg-slate-900 text-white shadow-2xl
                    border-t border-slate-700">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start
                        sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl shrink-0">🍪</span>
            <div>
              <p className="text-sm font-semibold text-white">
                We use cookies to improve your experience
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                We use essential cookies for authentication and
                optional analytics cookies to improve our service.
                {' '}
                <Link to="/cookies"
                  className="text-blue-400 hover:text-blue-300 underline">
                  Learn more
                </Link>
              </p>

              {showDetails && (
                <div className="mt-3 space-y-2">
                  {[
                    {
                      name: '✅ Essential Cookies',
                      desc: 'Required for login and app functionality. Cannot be disabled.',
                      required: true,
                    },
                    {
                      name: '📊 Analytics Cookies',
                      desc: 'Help us understand how you use the app to improve it.',
                      required: false,
                    },
                    {
                      name: '🤖 AI Session Cookies',
                      desc: 'Store your chat and study session data locally.',
                      required: false,
                    },
                  ].map(({ name, desc, required }) => (
                    <div key={name}
                      className="flex items-start gap-2 p-2
                                 bg-slate-800 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                      </div>
                      {required && (
                        <span className="text-[10px] bg-slate-600 text-slate-300
                                         px-2 py-0.5 rounded-full shrink-0">
                          Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[10px] text-slate-400 hover:text-slate-300
                           underline mt-1">
                {showDetails ? 'Hide details' : 'Show cookie details'}
              </button>
            </div>
          </div>

          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={decline}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium
                         border border-slate-600 text-slate-300 rounded-lg
                         hover:bg-slate-800 transition-colors">
              Decline
            </button>
            <button
              onClick={accept}
              className="flex-1 sm:flex-none px-6 py-2 text-sm font-bold
                         bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 transition-colors">
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
