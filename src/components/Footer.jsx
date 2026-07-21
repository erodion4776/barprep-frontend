import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  const links = {
    Product: [
      { to: '/',          label: 'Home'        },
      { to: '/chat',      label: 'AI Coach'    },
      { to: '/mock-exam', label: 'Mock Exam'   },
      { to: '/tutorials', label: 'Tutorials'   },
      { to: '/study',     label: 'Study Center' },
    ],
    Support: [
      { to: '/faq',     label: 'FAQ'         },
      { to: '/contact', label: 'Contact Us'  },
      { to: '/about',   label: 'About Us'    },
    ],
    Legal: [
      { to: '/privacy',    label: 'Privacy Policy'   },
      { to: '/terms',      label: 'Terms of Service' },
      { to: '/cookies',    label: 'Cookie Policy'    },
      { to: '/disclaimer', label: 'Disclaimer'       },
    ],
  }

  return (
    <footer className="bg-slate-900 text-slate-400 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Top Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg
                              flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-white text-lg">
                BarPrep <span className="text-blue-400">AI</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Your personal AI-powered bar exam coach.
              Study smarter, practice harder, pass with confidence.
            </p>
            <div className="bg-amber-900/30 border border-amber-700/30
                            rounded-lg p-3">
              <p className="text-[10px] text-amber-400 font-medium leading-relaxed">
                ⚠️ <span className="font-bold">Disclaimer:</span> BarPrep AI
                is an educational tool. It is not a substitute for
                licensed legal advice or accredited bar prep courses.
              </p>
            </div>
          </div>

          {/* Link Groups */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-white font-bold text-sm uppercase
                             tracking-wider mb-4">
                {group}
              </h3>
              <ul className="space-y-2.5">
                {items.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-6">
          <div className="flex flex-col sm:flex-row items-center
                          justify-between gap-4">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              © {year} BarPrep AI. All rights reserved.
              Not affiliated with the National Conference of Bar Examiners (NCBE).
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy"
                className="text-xs hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/terms"
                className="text-xs hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/cookies"
                className="text-xs hover:text-white transition-colors">
                Cookies
              </Link>
              <button
                onClick={() => localStorage.removeItem('cookie_consent') || window.location.reload()}
                className="text-xs hover:text-white transition-colors underline">
                Cookie Settings
              </button>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
