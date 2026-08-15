import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate }  from 'react-router-dom'
import { supabase }           from '../api/client'
import Affirmation            from '../components/Affirmation'
import { useProgress }        from '../context/ProgressContext'
import { useSubscription }    from '../context/SubscriptionContext'

// ── Auth-required routes ──────────────────────────────────────────────────────
const AUTH_REQUIRED = new Set(['/chat', '/mock-exam', '/study'])

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'AI Coach',
    desc:  'Ask any bar exam question and get step-by-step legal reasoning powered by AI.',
    to:    '/chat',
    icon:  '🤖',
    cta:   'Start Chatting',
    color: 'border-blue-500',
    auth:  true,
  },
  {
    title: 'Study Center',
    desc:  'Get a personalized day-by-day study plan and submit assignments for AI grading.',
    to:    '/study',
    icon:  '📚',
    cta:   'Study Now',
    color: 'border-purple-500',
    auth:  true,
  },
  {
    title: 'Mock Exam',
    desc:  'Simulate real bar exam conditions with AI-generated MBE questions.',
    to:    '/mock-exam',
    icon:  '📝',
    cta:   'Take Exam',
    color: 'border-green-500',
    auth:  true,
  },
  {
    title: 'Video Tutorials',
    desc:  'Watch bar exam lecture videos with an AI coach that answers questions in real time.',
    to:    '/tutorials',
    icon:  '🎥',
    cta:   'Watch Now',
    color: 'border-amber-500',
    auth:  false,
  },
  {
    title: 'Bar Prep Blog',
    desc:  'Daily AI-generated blog posts on bar exam topics, legal updates, and study strategies.',
    to:    '/blog',
    icon:  '📰',
    cta:   'Read Blog',
    color: 'border-rose-500',
    auth:  false,
  },
  {
    title: 'Progress Analytics',
    desc:  'Track accuracy, streaks, and topic performance with detailed diagnostic reports.',
    to:    '/mock-exam',
    icon:  '📊',
    cta:   'View Analytics',
    color: 'border-indigo-500',
    auth:  true,
  },
]

// ── Fade-in hook ──────────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return visible
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { progress }                   = useProgress()
  const { isFree, plan, checkLimit }   = useSubscription()

  const [user,        setUser]        = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const heroVisible    = useFadeIn(100)
  const contentVisible = useFadeIn(300)

  // SEO
  useEffect(() => {
    document.title = 'Dashboard — BarPrep AI'
  }, [])

  // ── Auth state ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        setUser(session?.user ?? null)
        setAuthLoading(false)
      }
    )
    return () => subscription?.unsubscribe()
  }, [])

  // ── Auth-aware navigation ──────────────────────────────────────────────────
  const handleNav = useCallback((e, to, requiresAuth) => {
    if (authLoading) { e.preventDefault(); return }
    if (requiresAuth && !user) {
      e.preventDefault()
      navigate('/login', { state: { from: to } })
    }
  }, [user, authLoading, navigate])

  // ── Progress data ──────────────────────────────────────────────────────────
  const {
    stats, weakTopics, strongTopics,
    recommendedTopics, watchedModules,
  } = progress

  const hasProgress = stats.totalAttempts > 0 || watchedModules.length > 0

  // ── Plan badge ─────────────────────────────────────────────────────────────
  const planBadge = {
    free:     { label: 'Free Plan',    bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200'   },
    pro:      { label: '🔥 Pro Plan',  bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200'    },
    barready: { label: '👑 Bar Ready', bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200'  },
  }[plan] || { label: 'Free Plan', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }

  return (
    <div className="space-y-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-0">

      {/* ── Hero ── */}
      <div className={`
        text-center space-y-5 py-8 transition-all duration-700
        ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {/* Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1
                           bg-blue-50 border border-blue-200 text-blue-700
                           text-xs font-bold rounded-full">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            AI-Powered Bar Exam Prep
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
          Pass The Bar Exam{' '}
          <span className="text-blue-600">With AI</span>
        </h1>

        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Your personal AI-powered bar exam coach. Study smarter,
          practice harder, and walk into exam day with confidence.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
          <Link
            to="/chat"
            onClick={e => handleNav(e, '/chat', true)}
            className="px-8 py-3 bg-blue-600 text-white font-bold text-base
                       rounded-xl hover:bg-blue-700 transition-all shadow-lg
                       shadow-blue-600/20 hover:shadow-xl hover:-translate-y-0.5"
          >
            Start Studying →
          </Link>
          <Link
            to="/mock-exam"
            onClick={e => handleNav(e, '/mock-exam', true)}
            className="px-8 py-3 border border-slate-200 text-slate-700
                       font-bold text-base rounded-xl hover:bg-slate-50
                       transition-all hover:-translate-y-0.5"
          >
            Take Mock Exam
          </Link>
          <Link
            to="/blog"
            className="px-8 py-3 border border-slate-200 text-slate-600
                       font-medium text-base rounded-xl hover:bg-slate-50
                       transition-all"
          >
            📰 Read Blog
          </Link>
        </div>
      </div>

      {/* ── Daily Affirmation ── */}
      <div className={`transition-all duration-700 delay-200
        ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <Affirmation />
      </div>

      {/* ── Personalized Dashboard (logged in + has data) ── */}
      {user && hasProgress && !progress.loading && (
        <div className={`space-y-4 transition-all duration-700 delay-300
          ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-slate-900 font-bold text-lg flex items-center gap-2">
              📊 Your Progress Dashboard
              {stats.currentStreak > 0 && (
                <span className="text-sm font-normal text-orange-500">
                  🔥 {stats.currentStreak}-day streak!
                </span>
              )}
            </h2>
            {/* Plan badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full
                             border ${planBadge.bg} ${planBadge.border}`}>
              <span className={`text-xs font-bold ${planBadge.text}`}>
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

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Questions',    value: stats.totalAttempts,          color: 'text-slate-900'  },
              { label: 'Accuracy',     value: `${stats.overallAccuracy}%`,  color: 'text-blue-600'   },
              { label: 'Strong Topics',value: strongTopics.length,          color: 'text-green-600'  },
              { label: 'Focus Topics', value: weakTopics.length,            color: 'text-amber-600'  },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-xl p-4 text-center"
              >
                <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Free plan usage meters ── */}
          {isFree && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  📊 Today's Free Plan Usage
                </h3>
                <Link
                  to="/pricing"
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Upgrade →
                </Link>
              </div>

              {/* AI Messages meter */}
              {(() => {
                const check = checkLimit('aiMessages')
                const pct   = check.limit === -1 ? 0
                  : Math.min(((check.used || 0) / check.limit) * 100, 100)
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">🤖 AI Messages</span>
                      <span className={`font-bold
                        ${check.remaining === 0 ? 'text-red-600'
                          : check.remaining <= 3 ? 'text-amber-600'
                          : 'text-slate-700'
                        }`}>
                        {check.remaining === 0
                          ? '0 left — upgrade!'
                          : `${check.remaining} / ${check.limit} left`
                        }
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all
                          ${pct >= 100 ? 'bg-red-500'
                            : pct >= 70 ? 'bg-amber-500'
                            : 'bg-blue-500'
                          }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })()}

              {/* Mock Questions meter */}
              {(() => {
                const check = checkLimit('mockQuestions')
                const pct   = check.limit === -1 ? 0
                  : Math.min(((check.used || 0) / check.limit) * 100, 100)
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">📝 Mock Questions</span>
                      <span className={`font-bold
                        ${check.remaining === 0 ? 'text-red-600'
                          : check.remaining <= 2 ? 'text-amber-600'
                          : 'text-slate-700'
                        }`}>
                        {check.remaining === 0
                          ? '0 left — upgrade!'
                          : `${check.remaining} / ${check.limit} left`
                        }
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all
                          ${pct >= 100 ? 'bg-red-500'
                            : pct >= 70 ? 'bg-amber-500'
                            : 'bg-green-500'
                          }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })()}

              <p className="text-[10px] text-slate-400 text-center">
                Limits reset daily at midnight UTC
              </p>

              <div className="flex gap-2">
                <Link
                  to="/pricing"
                  className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold
                             rounded-xl hover:bg-blue-700 transition-colors text-center"
                >
                  🚀 Pro — $100/mo
                </Link>
                <Link
                  to="/pricing"
                  className="flex-1 py-2.5 bg-purple-600 text-white text-xs font-bold
                             rounded-xl hover:bg-purple-700 transition-colors text-center"
                >
                  👑 Bar Ready — $400/yr
                </Link>
              </div>
            </div>
          )}

          {/* Recommended topics */}
          {recommendedTopics.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wide">
                🎯 AI Recommends — Study These Next
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendedTopics.map(topic => (
                  <Link
                    key={topic}
                    to="/mock-exam"
                    state={{ topic }}
                    onClick={e => handleNav(e, '/mock-exam', true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm
                               font-medium rounded-full hover:bg-blue-700
                               transition-colors"
                  >
                    {topic} →
                  </Link>
                ))}
              </div>
              <p className="text-xs text-blue-700">
                Based on your exam history, these topics need the most attention.
              </p>
            </div>
          )}

          {/* Quick access cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              {
                to:    '/mock-exam',
                icon:  '📝',
                title: 'Practice Exam',
                desc:  stats.totalAttempts > 0
                  ? `${stats.totalAttempts} done • ${stats.overallAccuracy}% accuracy`
                  : 'Start your first exam',
                color: 'border-blue-500',
                auth:  true,
              },
              {
                to:    '/tutorials',
                icon:  '🎥',
                title: 'Tutorials',
                desc:  watchedModules.length > 0
                  ? `${watchedModules.length} watched`
                  : 'Watch lecture videos',
                color: 'border-purple-500',
                auth:  false,
              },
              {
                to:    '/chat',
                icon:  '🤖',
                title: 'AI Coach',
                desc:  weakTopics.length > 0
                  ? `Get help with ${weakTopics[0]}`
                  : 'Ask any bar question',
                color: 'border-green-500',
                auth:  true,
              },
              {
                to:    '/blog',
                icon:  '📰',
                title: 'Blog',
                desc:  'Daily bar prep tips',
                color: 'border-rose-500',
                auth:  false,
              },
            ].map(({ to, icon, title, desc, color, auth }) => (
              <Link
                key={to + title}
                to={to}
                onClick={e => handleNav(e, to, auth)}
                className={`bg-white border border-slate-200 rounded-xl p-4
                            hover:shadow-md transition-all hover:-translate-y-0.5
                            border-l-4 ${color}`}
              >
                <div className="text-lg mb-1">{icon}</div>
                <div className="font-semibold text-slate-900 text-sm">{title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
              </Link>
            ))}
          </div>

          {/* Weak topics alert */}
          {weakTopics.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl
                            p-4 flex items-start gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">
                  Focus Areas Detected
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You need more practice in:{' '}
                  <span className="font-bold">
                    {weakTopics.slice(0, 3).join(', ')}
                  </span>
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Link
                    to="/tutorials"
                    className="text-xs bg-amber-600 text-white px-3 py-1
                               rounded-full hover:bg-amber-700 transition-colors"
                  >
                    Watch Tutorials →
                  </Link>
                  <Link
                    to="/mock-exam"
                    onClick={e => handleNav(e, '/mock-exam', true)}
                    className="text-xs bg-white border border-amber-300 text-amber-800
                               px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
                  >
                    Practice Now →
                  </Link>
                  <Link
                    to="/blog"
                    className="text-xs bg-white border border-amber-300 text-amber-800
                               px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
                  >
                    📰 Read Tips →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Features Grid ── */}
      <div className={`transition-all duration-700 delay-400
        ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h2 className="text-slate-900 mb-4 font-bold text-lg">
          {hasProgress ? '⚡ Quick Access' : '🎓 Everything You Need to Pass'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ title, desc, to, icon, cta, color, auth }) => (
            <div
              key={to + title}
              className={`bg-white border border-slate-200 rounded-2xl
                          hover:shadow-lg transition-all duration-200
                          hover:-translate-y-0.5 flex flex-col p-5
                          border-t-4 ${color}`}
            >
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="text-slate-900 mb-2 font-bold text-sm">{title}</h3>
              <p className="text-slate-500 text-xs flex-1 mb-4 leading-relaxed">
                {desc}
              </p>
              <Link
                to={to}
                onClick={e => handleNav(e, to, auth)}
                className="text-center py-2 bg-blue-600 text-white text-xs font-bold
                           rounded-xl hover:bg-blue-700 transition-colors"
              >
                {cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-slate-200">
          {[
            { label: 'AI Powered',     value: '100%'      },
            { label: 'Topics Covered', value: 'MBE + MEE' },
            { label: 'Available',      value: '24/7'      },
          ].map(({ label, value }) => (
            <div key={label} className="text-center px-4 py-5">
              <div className="text-2xl font-black text-blue-600">{value}</div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Blog teaser (not logged in) ── */}
      {!user && (
        <div className="bg-gradient-to-r from-slate-900 to-blue-900
                        rounded-2xl p-6 sm:p-8 text-white space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📰</span>
            <h2 className="text-xl font-black">Bar Prep Blog</h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
            Daily AI-generated articles covering bar exam topics, legal updates,
            study strategies, and exam tips — updated every day from live bar prep feeds.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/blog"
              className="px-6 py-2.5 bg-white text-slate-900 font-bold text-sm
                         rounded-xl hover:bg-slate-100 transition-colors"
            >
              Read the Blog →
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm
                         rounded-xl hover:bg-blue-700 transition-colors border border-blue-500"
            >
              Create Free Account →
            </Link>
          </div>
        </div>
      )}

      {/* ── Pricing teaser (logged in, free plan) ── */}
      {user && isFree && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-700
                        rounded-2xl p-6 sm:p-8 text-white space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-black">Unlock Full Access</h2>
              <p className="text-blue-100 text-sm mt-1">
                You're on the Free plan. Upgrade to access unlimited AI coaching,
                mock exams, personalized study plans, and more.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white">🔥 Pro Plan</h3>
                <span className="text-2xl font-black">$100<span className="text-sm font-normal">/mo</span></span>
              </div>
              <ul className="space-y-1 text-xs text-blue-100">
                <li>✓ Unlimited AI coaching</li>
                <li>✓ Unlimited mock exams</li>
                <li>✓ Personalized study plan</li>
                <li>✓ Assignment AI grading</li>
              </ul>
              <Link
                to="/pricing"
                className="block w-full py-2 bg-blue-600 text-white text-xs font-bold
                           rounded-xl hover:bg-blue-700 transition-colors text-center mt-2"
              >
                Start Pro →
              </Link>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 space-y-2 border border-purple-400/30">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white">👑 Bar Ready</h3>
                <span className="text-2xl font-black">$400<span className="text-sm font-normal">/yr</span></span>
              </div>
              <ul className="space-y-1 text-xs text-blue-100">
                <li>✓ Everything in Pro</li>
                <li>✓ Full year access</li>
                <li>✓ Save $800 vs monthly</li>
                <li>✓ Pass guarantee</li>
              </ul>
              <Link
                to="/pricing"
                className="block w-full py-2 bg-purple-600 text-white text-xs font-bold
                           rounded-xl hover:bg-purple-700 transition-colors text-center mt-2"
              >
                Go Bar Ready →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Not logged in CTA ── */}
      {!user && !authLoading && (
        <div className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-black text-slate-900">
            Ready to Start Preparing?
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Create a free account to unlock your personalized AI coach,
            mock exams, and study plan.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              to="/signup"
              className="px-10 py-3 bg-blue-600 text-white font-bold rounded-xl
                         hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              Create Free Account →
            </Link>
            <Link
              to="/about"
              className="px-10 py-3 border border-slate-200 text-slate-600
                         font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
