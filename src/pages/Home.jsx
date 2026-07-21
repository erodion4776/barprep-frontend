import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../api/client'
import Affirmation from '../components/Affirmation'
import { useProgress } from '../context/ProgressContext'

export default function Home() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const { progress } = useProgress()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription?.unsubscribe()
  }, [])

  const handleNav = (e, to) => {
    if (!user) { e.preventDefault(); navigate('/login') }
  }

  const { stats, weakTopics, strongTopics, recommendedTopics, watchedModules } = progress
  const hasProgress = stats.totalAttempts > 0 || watchedModules.length > 0

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Pass The Bar Exam With{' '}
          <span className="text-blue-600">AI</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Your personal AI-powered bar exam coach. Study smarter,
          practice harder, and walk into exam day with confidence.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
          <Link
            to="/chat"
            onClick={(e) => handleNav(e, '/chat')}
            className="btn-primary text-base px-6 py-3"
          >
            Start Studying →
          </Link>
          <Link
            to="/mock-exam"
            onClick={(e) => handleNav(e, '/mock-exam')}
            className="btn-secondary text-base px-6 py-3"
          >
            Take Mock Exam
          </Link>
        </div>
      </div>

      {/* Daily Affirmation */}
      <Affirmation />

      {/* ── Personalized Progress Dashboard (shown when logged in + has data) ── */}
      {user && hasProgress && (
        <div className="space-y-4">
          <h2 className="text-slate-900 font-bold text-lg">
            📊 Your Progress Dashboard
          </h2>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Questions Done',  value: stats.totalAttempts,       color: 'text-slate-900' },
              { label: 'Accuracy',        value: `${stats.overallAccuracy}%`, color: 'text-blue-600'  },
              { label: 'Strong Topics',   value: strongTopics.length,        color: 'text-green-600' },
              { label: 'Needs Work',      value: weakTopics.length,          color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-4 text-center">
                <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Recommended Next Steps */}
          {recommendedTopics.length > 0 && (
            <div className="card bg-blue-50 border border-blue-200 p-5 space-y-3">
              <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wide">
                🎯 AI Recommends — Study These Next
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendedTopics.map(topic => (
                  <Link
                    key={topic}
                    to={`/mock-exam`}
                    state={{ topic }}
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

          {/* Quick Links based on progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/mock-exam"
              className="card p-4 hover:shadow-md transition-all
                         hover:-translate-y-0.5 border-l-4 border-blue-500"
            >
              <div className="text-lg mb-1">📝</div>
              <div className="font-semibold text-slate-900 text-sm">Practice Exam</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {stats.totalAttempts > 0
                  ? `${stats.totalAttempts} questions done • ${stats.overallAccuracy}% accuracy`
                  : 'Start your first exam'}
              </div>
            </Link>

            <Link
              to="/tutorials"
              className="card p-4 hover:shadow-md transition-all
                         hover:-translate-y-0.5 border-l-4 border-purple-500"
            >
              <div className="text-lg mb-1">🎥</div>
              <div className="font-semibold text-slate-900 text-sm">Video Tutorials</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {watchedModules.length > 0
                  ? `${watchedModules.length} video${watchedModules.length !== 1 ? 's' : ''} watched`
                  : 'Watch lecture videos'}
              </div>
            </Link>

            <Link
              to="/chat"
              className="card p-4 hover:shadow-md transition-all
                         hover:-translate-y-0.5 border-l-4 border-green-500"
            >
              <div className="text-lg mb-1">🤖</div>
              <div className="font-semibold text-slate-900 text-sm">AI Coach</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {weakTopics.length > 0
                  ? `Get help with ${weakTopics[0]}`
                  : 'Ask any bar exam question'}
              </div>
            </Link>
          </div>

          {/* Weak Topics Alert */}
          {weakTopics.length > 0 && (
            <div className="card bg-amber-50 border border-amber-200 p-4
                            flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">
                  Focus Areas Detected
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You need more practice in:{' '}
                  <span className="font-bold">{weakTopics.slice(0, 3).join(', ')}</span>
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Link to="/tutorials"
                    className="text-xs bg-amber-600 text-white px-3 py-1
                               rounded-full hover:bg-amber-700 transition-colors">
                    Watch Tutorials →
                  </Link>
                  <Link to="/mock-exam"
                    className="text-xs bg-white border border-amber-300
                               text-amber-800 px-3 py-1 rounded-full
                               hover:bg-amber-50 transition-colors">
                    Practice Now →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Features (shown to everyone) */}
      <div>
        <h2 className="text-slate-900 mb-4 font-bold">
          {hasProgress ? 'Quick Access' : 'Everything You Need'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'AI Coach',
              description: 'Ask any bar exam question and get step-by-step legal reasoning powered by AI and your study materials.',
              to: '/chat',
              icon: '🤖',
              cta: 'Start Chatting',
            },
            {
              title: 'Study Modules',
              description: 'Ingest bar prep websites and YouTube lectures. The AI learns from your materials to coach you better.',
              to: '/study',
              icon: '📚',
              cta: 'Study Now',
            },
            {
              title: 'Mock Exam',
              description: 'Simulate real bar exam conditions with AI-generated questions. Get instant feedback and explanations.',
              to: '/mock-exam',
              icon: '📝',
              cta: 'Take Exam',
            },
          ].map(({ title, description, to, icon, cta }) => (
            <div key={to} className="card hover:shadow-md transition-shadow
                                     duration-200 flex flex-col">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="text-slate-900 mb-2 font-semibold">{title}</h3>
              <p className="text-slate-500 text-sm flex-1 mb-4">{description}</p>
              <Link
                to={to}
                onClick={(e) => handleNav(e, to)}
                className="btn-primary text-sm text-center"
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="card">
        <div className="grid grid-cols-3 divide-x divide-slate-200">
          {[
            { label: 'AI Powered',     value: '100%'    },
            { label: 'Topics Covered', value: 'MBE + MEE' },
            { label: 'Available',      value: '24/7'    },
          ].map(({ label, value }) => (
            <div key={label} className="text-center px-4">
              <div className="text-2xl font-bold text-blue-600">{value}</div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
