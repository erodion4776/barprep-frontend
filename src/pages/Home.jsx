import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../api/client'
import Affirmation from '../components/Affirmation'

const features = [
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
]

export default function Home() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleNav = (e, to) => {
    if (!user) {
      e.preventDefault()
      navigate('/login')
    }
  }

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
        <div className="flex items-center justify-center gap-4 pt-2">
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

      {/* Features */}
      <div>
        <h2 className="text-slate-900 mb-4">Everything You Need</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(({ title, description, to, icon, cta }) => (
            <div key={to} className="card hover:shadow-md 
                                     transition-shadow duration-200 
                                     flex flex-col">
               <div className="text-3xl mb-3">{icon}</div>
               <h3 className="text-slate-900 mb-2">{title}</h3>
               <p className="text-slate-500 text-sm flex-1 mb-4">
                 {description}
               </p>
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
            { label: 'AI Powered',    value: '100%' },
            { label: 'Topics Covered', value: 'MBE + MEE' },
            { label: 'Available',     value: '24/7' },
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
