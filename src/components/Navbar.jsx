import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Home'         },
  { to: '/chat',      label: 'AI Coach'     },
  { to: '/study',     label: 'Study'        },
  { to: '/mock-exam', label: 'Mock Exam'    },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg 
                            flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">
              BarPrep <span className="text-blue-600">AI</span>
            </span>
          </Link>

          {/* Nav Links */}
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
          </div>

          {/* Mobile menu - simplified */}
          <div className="sm:hidden flex items-center gap-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-2 py-1 rounded text-xs font-medium
                  ${pathname === to
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600'
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </nav>
  )
}
