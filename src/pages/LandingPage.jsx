import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate }  from 'react-router-dom'
import { supabase }           from '../api/client'

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useCounter(end, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, start])
  return count
}

function useInView(threshold = 0.1) {
  const ref     = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

function useTypingAnimation(texts, speed = 80) {
  const [displayText, setDisplayText] = useState('')
  const [textIndex,   setTextIndex]   = useState(0)
  const [charIndex,   setCharIndex]   = useState(0)
  const [deleting,    setDeleting]    = useState(false)

  useEffect(() => {
    const current = texts[textIndex]
    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIndex < current.length) {
          setDisplayText(current.slice(0, charIndex + 1))
          setCharIndex(c => c + 1)
        } else {
          setTimeout(() => setDeleting(true), 1500)
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(current.slice(0, charIndex - 1))
          setCharIndex(c => c - 1)
        } else {
          setDeleting(false)
          setTextIndex(i => (i + 1) % texts.length)
        }
      }
    }, deleting ? speed / 2 : speed)
    return () => clearTimeout(timeout)
  }, [charIndex, deleting, textIndex, texts, speed])

  return displayText
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all
      duration-300 ${open
        ? 'border-blue-200 bg-blue-50/30'
        : 'border-slate-200 bg-white'
      }`}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between p-5
                   text-left gap-4 hover:bg-slate-50/50 transition-colors"
      >
        <span className="font-semibold text-slate-900 text-sm sm:text-base">
          {q}
        </span>
        <span className={`text-blue-600 text-xl font-bold shrink-0
                          transition-transform duration-300
                          ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300
        ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed
                        border-t border-slate-100 pt-4">
          {a}
        </div>
      </div>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────
const TYPING_TEXTS = [
  'Pass the Bar Exam',
  'Master Legal Rules',
  'Ace MBE Questions',
  'Build Confidence',
  'Study Smarter',
]

const TOPICS = [
  'Constitutional Law', 'Contracts',    'Torts',
  'Criminal Law',       'Civil Procedure', 'Evidence',
  'Real Property',      'Business Associations',
  'Family Law',         'Wills & Trusts',
]

const FEATURES = [
  { icon: '🤖', title: 'AI Coach That Knows You',    desc: 'Your AI coach reads your exam history, identifies weak spots, and teaches exactly what you need.',                  color: 'bg-blue-50 border-blue-100',    iconBg: 'bg-blue-600'   },
  { icon: '📝', title: 'Realistic Mock Exams',        desc: 'AI-generated MBE questions with real exam pacing, instant grading, and detailed legal explanations.',               color: 'bg-purple-50 border-purple-100', iconBg: 'bg-purple-600' },
  { icon: '📅', title: 'Personalized Study Plan',     desc: 'Enter your exam date. The AI builds a day-by-day schedule prioritizing your weakest topics.',                      color: 'bg-green-50 border-green-100',   iconBg: 'bg-green-600'  },
  { icon: '📊', title: 'Deep Analytics',              desc: 'Track accuracy by topic, monitor pacing, and see your bar exam readiness score in real time.',                      color: 'bg-amber-50 border-amber-100',   iconBg: 'bg-amber-500'  },
  { icon: '✍️', title: 'Assignment AI Grader',         desc: 'Submit essays and legal memos. The AI grades them and gives specific, actionable feedback.',                        color: 'bg-rose-50 border-rose-100',     iconBg: 'bg-rose-600'   },
  { icon: '🎥', title: 'Interactive Tutorials',       desc: 'Watch bar exam lectures with a built-in AI coach that answers questions in real time.',                             color: 'bg-indigo-50 border-indigo-100', iconBg: 'bg-indigo-600' },
  { icon: '📰', title: 'Daily AI Blog',               desc: 'Fresh bar prep articles generated daily from live legal feeds — written by AI, reviewed by our team.',               color: 'bg-teal-50 border-teal-100',     iconBg: 'bg-teal-600'   },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Passed July 2024', state: 'California', avatar: 'SM', color: 'bg-blue-600',   text: 'I failed the bar twice before finding BarPrep AI. The personalized study plan identified that Contracts and Evidence were killing me. Three months later I passed!', score: '272/400 MBE Score' },
  { name: 'James T.', role: 'First-time Passer', state: 'New York',  avatar: 'JT', color: 'bg-purple-600', text: 'I went from 45% accuracy to 78% in six weeks. The AI explanations for wrong answers taught me more than weeks of reading outlines.',                         score: '286/400 MBE Score' },
  { name: 'Priya K.', role: 'Passed February 2024', state: 'Texas',  avatar: 'PK', color: 'bg-green-600',  text: 'As a working mom with limited study time, the daily study plan was a game-changer. I studied 2 hours a day and passed on my first attempt!',                   score: '268/400 MBE Score' },
  { name: 'Marcus R.', role: 'Passed July 2024', state: 'Florida',   avatar: 'MR', color: 'bg-amber-600',  text: 'The assignment analysis feature is extraordinary. My essay scores went from a 3 to a 5.5 average after using the AI grader.',                                  score: '279/400 MBE Score' },
]

const FAQS = [
  { q: 'Is BarPrep AI a replacement for Barbri or Themis?',    a: 'BarPrep AI is a powerful supplement to traditional bar prep courses. We recommend using it alongside an accredited bar prep program for maximum results.' },
  { q: 'How does the AI know what I need to study?',            a: 'Every time you answer a mock exam question, the AI tracks your performance by topic, accuracy, and speed. It builds a profile of your strengths and weaknesses to personalize everything.' },
  { q: 'Is the blog content written by lawyers?',               a: 'Our blog is AI-generated from live bar prep feeds and is for educational purposes only. Content has not been reviewed by licensed attorneys. Always verify with official sources.' },
  { q: 'Can I cancel anytime?',                                 a: 'Yes. No long-term contracts. Cancel anytime from your settings and retain access until the end of your billing period.' },
  { q: 'What does the $100/month Pro plan include?',            a: 'Unlimited AI coaching, unlimited mock exams, personalized study plans, assignment AI grading, full analytics, all video tutorials, daily blog access, and priority email support.' },
  { q: 'What about the $400/year Bar Ready plan?',              a: 'Everything in Pro plus full simulated bar exams, MEE essay grading, exam readiness reports, priority support, and a pass guarantee. You save $800 compared to paying monthly.' },
  { q: 'Is there a free plan?',                                 a: 'Yes! The Free plan gives you 10 AI messages and 5 mock questions per day at no cost — no credit card required. Upgrade to Pro or Bar Ready anytime.' },
  { q: 'What bar exams does BarPrep AI cover?',                 a: 'All 10 MBE subjects plus MEE essay topics for the Uniform Bar Exam (UBE).' },
  { q: 'Is BarPrep AI a law firm?',                             a: 'No. BarPrep AI is an educational study platform. It does not provide legal advice and is not affiliated with the NCBE or any state bar association.' },
]

const PLANS = [
  {
    name:        'Free',
    price:       0,
    period:      null,
    description: 'Get started with the basics',
    color:       'border-slate-200',
    badge:       null,
    features: [
      { text: '10 AI messages per day',           included: true  },
      { text: '5 mock exam questions per day',     included: true  },
      { text: 'Blog access',                       included: true  },
      { text: 'Video tutorials (free to watch)',   included: true  },
      { text: 'Basic progress tracking',           included: true  },
      { text: 'Personalized study plan',           included: false },
      { text: 'Assignment AI grading',             included: false },
      { text: 'Unlimited mock exams',              included: false },
      { text: 'Advanced analytics',                included: false },
      { text: 'Priority support',                  included: false },
    ],
    cta:      'Get Started Free',
    ctaStyle: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ctaTo:    '/signup',
  },
  {
    name:        'Pro',
    price:       100,
    period:      'month',
    description: 'Everything you need to pass',
    color:       'border-blue-600',
    badge:       '🔥 Most Popular',
    features: [
      { text: 'Unlimited AI coaching sessions',    included: true  },
      { text: 'Unlimited mock exam questions',     included: true  },
      { text: 'Personalized study plan',           included: true  },
      { text: 'Assignment AI grading & feedback',  included: true  },
      { text: 'Full progress analytics',           included: true  },
      { text: 'All video tutorials + AI coach',    included: true  },
      { text: 'Blog access',                       included: true  },
      { text: 'Priority email support',            included: true  },
      { text: 'Cancel anytime',                    included: true  },
      { text: 'Exam simulation',                   included: false },
    ],
    cta:      'Start Pro — $100/mo',
    ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200',
    ctaTo:    '/pricing',
  },
  {
    name:        'Bar Ready',
    price:       400,
    period:      'year',
    description: 'Maximum prep, best value',
    color:       'border-purple-500',
    badge:       '👑 Save $800',
    features: [
      { text: 'Everything in Pro',                 included: true  },
      { text: 'Full year access ($33/mo value)',   included: true  },
      { text: 'Simulated full bar exam',           included: true  },
      { text: 'MEE essay grading',                 included: true  },
      { text: 'Personalized weakness drills',      included: true  },
      { text: 'Exam day readiness report',         included: true  },
      { text: 'Priority support',                  included: true  },
      { text: 'Early access to new features',      included: true  },
      { text: 'Pass guarantee or money back',      included: true  },
      { text: 'Save $800 vs monthly Pro',          included: true  },
    ],
    cta:      'Go Bar Ready — $400/yr',
    ctaStyle: 'bg-purple-600 text-white hover:bg-purple-700 shadow-xl shadow-purple-200',
    ctaTo:    '/pricing',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()

  const [user,        setUser]        = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [statsRef, statsInView] = useInView()

  const typingText = useTypingAnimation(TYPING_TEXTS)

  const studentsCount  = useCounter(12000,  2500, statsInView)
  const questionsCount = useCounter(500000, 2500, statsInView)
  const passRateCount  = useCounter(94,     2000, statsInView)

  useEffect(() => {
    document.title = 'BarPrep AI — AI-Powered Bar Exam Preparation Platform'
  }, [])

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

  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen bg-gradient-to-br
                           from-slate-900 via-blue-950 to-slate-900
                           flex items-center justify-center
                           overflow-hidden px-4 py-20">

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            'top-1/4 left-1/4 bg-blue-600/20',
            'bottom-1/4 right-1/4 bg-purple-600/20',
            'top-1/2 left-1/2 bg-indigo-600/10',
          ].map((cls, i) => (
            <div
              key={i}
              className={`absolute w-96 h-96 rounded-full blur-3xl animate-pulse ${cls}`}
              style={{ animationDelay: `${i}s` }}
            />
          ))}
        </div>

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px),
                              linear-gradient(90deg,#fff 1px,transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">

          <div className="inline-flex items-center gap-2 px-4 py-2
                          bg-blue-600/20 border border-blue-500/30
                          rounded-full text-blue-300 text-sm font-medium
                          backdrop-blur-sm">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Bar Exam Preparation Platform
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black
                           text-white leading-tight tracking-tight">
              Use AI To
              <br />
              <span className="inline-block min-h-[1.2em] text-transparent
                               bg-clip-text bg-gradient-to-r from-blue-400
                               via-purple-400 to-blue-400">
                {typingText}
                <span className="text-blue-400 animate-pulse">|</span>
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl
                          mx-auto leading-relaxed">
              Your personal AI bar exam coach that knows your weaknesses,
              builds your study plan, grades your essays, and coaches
              you 24/7 until you pass.
            </p>
          </div>

          {/* ── Hero CTAs ── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <>
                <Link
                  to="/home"
                  className="w-full sm:w-auto px-10 py-4 bg-blue-600
                             text-white text-lg font-bold rounded-2xl
                             hover:bg-blue-500 transition-all duration-200
                             shadow-2xl shadow-blue-900/50
                             hover:-translate-y-0.5 active:scale-[0.98]
                             text-center"
                >
                  Go to Dashboard →
                </Link>
                <Link
                  to="/chat"
                  className="w-full sm:w-auto px-10 py-4 border border-slate-600
                             text-slate-300 text-lg font-bold rounded-2xl
                             hover:border-blue-500 hover:text-white
                             transition-all duration-200 text-center"
                >
                  🤖 AI Coach →
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-10 py-4 bg-blue-600
                             text-white text-lg font-bold rounded-2xl
                             hover:bg-blue-500 transition-all duration-200
                             shadow-2xl shadow-blue-900/50
                             hover:-translate-y-0.5 active:scale-[0.98]
                             text-center"
                >
                  Try Now — It's Free →
                </Link>
                <Link
                  to="/pricing"
                  className="w-full sm:w-auto px-10 py-4 border border-slate-600
                             text-slate-300 text-lg font-bold rounded-2xl
                             hover:border-blue-500 hover:text-white
                             transition-all duration-200 text-center"
                >
                  View Pricing
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 flex-wrap
                          text-slate-500 text-xs">
            {['✅ No credit card required','✅ Cancel anytime',
              '✅ GDPR compliant','✅ 24/7 AI access'].map(t => (
              <span key={t} className="font-medium">{t}</span>
            ))}
          </div>

          {/* Mock chat preview */}
          <div className="relative mt-8 mx-auto max-w-2xl">
            <div className="bg-slate-800/80 backdrop-blur-xl border
                            border-slate-700/50 rounded-2xl p-4
                            shadow-2xl shadow-black/50 text-left">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="ml-2 text-slate-500 text-xs font-mono">
                  BarPrep AI Coach
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white text-xs
                                  px-3 py-2 rounded-xl rounded-br-sm max-w-xs">
                    Explain the Erie doctrine for the bar exam
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-slate-700 text-slate-200 text-xs
                                  px-3 py-2 rounded-xl rounded-bl-sm max-w-sm">
                    <p className="font-bold text-blue-400 mb-1">
                      Erie Railroad Co. v. Tompkins (1938)
                    </p>
                    <p>
                      In diversity cases, federal courts must apply state{' '}
                      <span className="text-amber-400 font-semibold">
                        substantive law
                      </span>{' '}
                      but federal{' '}
                      <span className="text-green-400 font-semibold">
                        procedural law
                      </span>
                      . The key test: would applying the rule significantly
                      affect the outcome? ⚖️
                    </p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 text-slate-400 text-xs
                                  px-3 py-1.5 rounded-xl animate-pulse">
                    AI is typing...
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-green-500 text-white
                            text-xs font-bold px-3 py-1.5 rounded-full
                            shadow-lg animate-bounce">
              ✅ Just answered!
            </div>
            <div className="absolute -bottom-4 -left-4 bg-blue-600 text-white
                            text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              📊 94% pass rate*
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS
      ══════════════════════════════════════════ */}
      <section ref={statsRef} className="bg-blue-600 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { value: `${studentsCount.toLocaleString()}+`, label: 'Students Studying',  sub: 'and growing every day' },
              { value: `${questionsCount.toLocaleString()}+`, label: 'Questions Answered', sub: 'by our AI coach'       },
              { value: `${passRateCount}%*`,                  label: 'Pass Rate',          sub: 'among active Pro users'},
            ].map(({ value, label, sub }) => (
              <div key={label} className="space-y-1">
                <div className="text-5xl font-black text-white">{value}</div>
                <div className="text-blue-100 font-bold text-lg">{label}</div>
                <div className="text-blue-300 text-xs">{sub}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-blue-400 text-[10px] mt-6">
            * Statistics are illustrative projections. Individual results may vary.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TOPICS
      ══════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div>
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">
              Full Coverage
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              All 10 MBE Topics Covered
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm">
              Complete coverage of every subject tested on the Uniform Bar Exam.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {TOPICS.map(topic => (
              <div
                key={topic}
                className="px-5 py-2.5 bg-white border border-slate-200
                           rounded-full text-sm font-semibold text-slate-700
                           shadow-sm hover:border-blue-300 hover:text-blue-700
                           hover:shadow-md transition-all duration-200"
              >
                {topic}
              </div>
            ))}
          </div>
          <Link
            to={user ? '/mock-exam' : '/signup'}
            className="inline-block px-8 py-3 bg-blue-600 text-white
                       font-bold rounded-2xl hover:bg-blue-700 text-sm
                       transition-all hover:-translate-y-0.5"
          >
            Start Studying All Topics →
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest">
              Why BarPrep AI
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Everything You Need. Nothing You Don't.
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed">
              Built specifically for bar exam prep. Every feature designed
              with one goal — getting you through exam day.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc, color, iconBg }) => (
              <div
                key={title}
                className={`border rounded-2xl p-6 space-y-4 ${color}
                            hover:shadow-lg transition-all duration-300
                            hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 ${iconBg} rounded-2xl flex
                                 items-center justify-center text-2xl shadow-lg`}>
                  {icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <p className="text-blue-400 text-sm font-bold uppercase tracking-widest">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-black">
              From Sign Up to Pass in 4 Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '👤', title: 'Create Account', desc: 'Sign up free in 30 seconds. No credit card required.', color: 'text-blue-400'   },
              { step: '02', icon: '📅', title: 'Enter Exam Date', desc: 'The AI builds your personalized study calendar.',      color: 'text-purple-400' },
              { step: '03', icon: '📝', title: 'Practice Daily',  desc: 'Take mock exams, chat with AI, submit assignments.',   color: 'text-green-400'  },
              { step: '04', icon: '🎓', title: 'Pass the Bar',    desc: 'Walk into exam day prepared and confident.',            color: 'text-amber-400'  },
            ].map(({ step, icon, title, desc, color }) => (
              <div
                key={step}
                className="relative text-center space-y-4 p-6
                           bg-slate-800/50 rounded-2xl border border-slate-700/50"
              >
                <div className={`text-2xl font-black ${color} opacity-30
                                 absolute top-4 right-4`}>
                  {step}
                </div>
                <div className="text-4xl">{icon}</div>
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-lg">{title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              to={user ? '/home' : '/signup'}
              className="px-10 py-4 bg-blue-600 text-white font-bold
                         rounded-2xl hover:bg-blue-500 text-base
                         transition-all hover:-translate-y-0.5
                         shadow-2xl shadow-blue-900/50 inline-block"
            >
              {user ? 'Go to Dashboard →' : 'Start Your Journey Now →'}
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOG TEASER
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-teal-600 to-blue-700
                          rounded-3xl p-8 sm:p-12 text-white
                          flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">📰</span>
                <span className="text-xs font-bold bg-white/20 px-3 py-1
                                 rounded-full uppercase tracking-wide">
                  New Feature
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                Daily AI Bar Prep Blog
              </h2>
              <p className="text-teal-100 text-sm leading-relaxed max-w-md">
                Fresh articles generated every day from live bar prep feeds.
                Legal updates, exam strategies, topic breakdowns — all
                written by AI and approved by our team.
              </p>
              <div className="flex gap-3 flex-wrap pt-2">
                <Link
                  to="/blog"
                  className="px-6 py-2.5 bg-white text-teal-700 font-bold
                             text-sm rounded-xl hover:bg-teal-50 transition-colors"
                >
                  Read the Blog →
                </Link>
                <Link
                  to={user ? '/home' : '/signup'}
                  className="px-6 py-2.5 bg-white/20 hover:bg-white/30
                             text-white font-bold text-sm rounded-xl
                             transition-colors border border-white/30"
                >
                  {user ? 'Dashboard →' : 'Create Free Account'}
                </Link>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-72">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4
                              border border-white/20 space-y-3">
                <div className="w-full h-24 bg-white/10 rounded-xl
                                flex items-center justify-center">
                  <span className="text-4xl">⚖️</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] bg-teal-500/40 text-teal-100
                                   px-2 py-0.5 rounded-full">
                    Contracts
                  </span>
                  <p className="text-sm font-bold text-white">
                    10 Contract Formation Rules You Must Know for the Bar
                  </p>
                  <p className="text-[10px] text-teal-200">
                    AI-generated • 5 min read
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest">
              Success Stories
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Real Students. Real Results.
            </h2>
            <p className="text-slate-400 text-xs">
              * Testimonials are illustrative examples. Individual results may vary.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map(({ name, role, state, avatar, color, text, score }) => (
              <div
                key={name}
                className="bg-white border border-slate-200 rounded-2xl
                           p-6 space-y-4 hover:shadow-lg transition-all
                           duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${color} rounded-2xl flex
                                     items-center justify-center text-white
                                     font-black text-sm shrink-0`}>
                      {avatar}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{name}</p>
                      <p className="text-xs text-slate-500">{role} — {state}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className="text-amber-400 text-sm">★</span>
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  "{text}"
                </p>
                <div className="bg-green-50 border border-green-200
                                rounded-xl px-3 py-2 inline-block">
                  <p className="text-xs font-bold text-green-700">🎯 {score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest">
              Simple Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Invest in Your Legal Career
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              At $100/month, BarPrep AI costs less than one hour with
              a private tutor — and it's available 24/7.
            </p>
            <div className="inline-flex items-center gap-2 bg-purple-50
                            border border-purple-200 rounded-xl px-4 py-2 text-sm">
              <span className="text-purple-700 font-bold">
                👑 Bar Ready saves you $800/year
              </span>
              <span className="text-purple-500 text-xs">
                ($400/yr vs $100/mo × 12 = $1,200)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`
                  relative border-2 rounded-3xl p-7 space-y-6
                  transition-all duration-300
                  ${plan.badge
                    ? plan.name === 'Pro'
                      ? 'shadow-2xl shadow-blue-100 scale-105'
                      : 'shadow-xl shadow-purple-100'
                    : 'hover:shadow-lg'
                  }
                  ${plan.color}
                `}
              >
                {plan.badge && (
                  <div className={`
                    absolute -top-4 left-1/2 -translate-x-1/2
                    text-white text-xs font-black px-4 py-1.5
                    rounded-full whitespace-nowrap shadow-lg
                    ${plan.name === 'Pro' ? 'bg-blue-600' : 'bg-purple-600'}
                  `}>
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                  <p className="text-slate-500 text-xs">{plan.description}</p>
                  <div className="flex items-end gap-1 pt-2">
                    <span className="text-5xl font-black text-slate-900">
                      ${plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-slate-500 text-sm mb-2">
                        /{plan.period}
                      </span>
                    )}
                  </div>

                  {plan.name === 'Bar Ready' && (
                    <div className="bg-purple-50 border border-purple-200
                                    rounded-xl p-2 text-center">
                      <p className="text-xs font-bold text-purple-700">
                        🎉 Only $33/month • Save $800 vs Pro monthly
                      </p>
                    </div>
                  )}

                  {plan.price === 0 && (
                    <p className="text-xs text-slate-500">
                      Forever free — no credit card
                    </p>
                  )}
                </div>

                <Link
                  to={plan.ctaTo}
                  className={`block w-full py-3.5 rounded-2xl text-sm
                               font-black transition-all duration-200
                               hover:-translate-y-0.5 text-center
                               ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map(({ text, included }) => (
                    <li
                      key={text}
                      className={`flex items-start gap-3 text-xs
                        ${included ? 'text-slate-700' : 'text-slate-400'}`}
                    >
                      <span className={`shrink-0 mt-0.5 font-bold text-sm
                        ${included ? 'text-green-500' : 'text-slate-300'}`}>
                        {included ? '✓' : '✗'}
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center space-y-2">
            <p className="text-slate-500 text-sm">
              🔒 <span className="font-semibold">Secure payment</span>
              {' '}•{' '}Cancel anytime{' '}•{' '}No hidden fees
            </p>
            <p className="text-xs text-slate-400">
              The Bar Ready plan includes a pass guarantee — if you follow
              the plan and don't pass, we'll refund you.
            </p>
            <Link
              to="/pricing"
              className="inline-block text-blue-600 hover:underline
                         text-sm font-semibold"
            >
              See full plan comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMPARISON TABLE
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900">
              BarPrep AI vs Traditional Prep
            </h2>
            <p className="text-slate-500 text-sm">
              See why students are switching to AI-powered prep.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left p-4 font-bold rounded-tl-2xl">Feature</th>
                  <th className="text-center p-4 font-bold text-blue-400">BarPrep AI</th>
                  <th className="text-center p-4 font-bold text-slate-400 rounded-tr-2xl">Traditional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Cost',               '$100/mo or $400/yr',  '$1,500–$4,000'      ],
                  ['Available',          '24/7 always on',       'Fixed schedule'      ],
                  ['Personalization',    'AI-personalized',      'Generic curriculum'  ],
                  ['Mock Questions',     'Unlimited',            'Limited bank'        ],
                  ['Essay Grading',      'Instant AI feedback',  'Delayed grading'     ],
                  ['Progress Tracking',  'Real-time analytics',  'Self-tracked'        ],
                  ['Study Plan',         'AI builds from data',  'Generic timeline'    ],
                  ['Daily Blog',         '✅ AI-generated',      '❌ No'               ],
                  ['Adapts to Weakness', '✅ Yes',               '❌ No'               ],
                  ['Cancel Anytime',     '✅ Yes',               '❌ Non-refundable'   ],
                ].map(([feat, ai, trad], i) => (
                  <tr key={feat}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-4 font-medium text-slate-700">{feat}</td>
                    <td className="p-4 text-center text-green-700 font-semibold
                                   bg-green-50/50">{ai}</td>
                    <td className="p-4 text-center text-slate-500">{trad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest">
              FAQ
            </p>
            <h2 className="text-3xl font-black text-slate-900">
              Common Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/faq"
              className="text-blue-600 hover:underline text-sm font-semibold"
            >
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600
                          via-blue-700 to-purple-800 text-white
                          relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96
                          bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80
                          bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">
              Your Bar Exam Is Waiting.
              <br />
              <span className="text-blue-200">Are You Ready?</span>
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto leading-relaxed">
              Join students using AI to study smarter.
              Start free today — no credit card needed.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/home"
                className="w-full sm:w-auto px-12 py-5 bg-white text-blue-700
                           text-xl font-black rounded-2xl hover:bg-blue-50
                           transition-all duration-200 shadow-2xl
                           hover:-translate-y-1 active:scale-[0.98]
                           text-center"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <Link
                to="/signup"
                className="w-full sm:w-auto px-12 py-5 bg-white text-blue-700
                           text-xl font-black rounded-2xl hover:bg-blue-50
                           transition-all duration-200 shadow-2xl
                           hover:-translate-y-1 active:scale-[0.98]
                           text-center"
              >
                Try Now — It's Free →
              </Link>
            )}
            <Link
              to="/pricing"
              className="text-blue-200 hover:text-white text-sm
                         font-semibold underline transition-colors"
            >
              See plans: $100/mo or $400/yr
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 flex-wrap
                          text-blue-200 text-xs">
            {['✅ Free plan available','✅ Cancel anytime',
              '✅ 24/7 AI access','✅ No contracts'].map(t => (
              <span key={t} className="font-medium">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DISCLAIMER FOOTER
      ══════════════════════════════════════════ */}
      <div className="bg-slate-900 py-6 px-4">
        <p className="text-center text-slate-500 text-xs max-w-3xl mx-auto">
          ⚠️ BarPrep AI is an educational tool and is not affiliated with the
          NCBE or any state bar association. AI-generated content — including
          blog posts — may contain errors. Statistics are illustrative.
          We do not guarantee bar exam results.{' '}
          <Link to="/disclaimer" className="text-slate-400 hover:text-white underline">
            Full Disclaimer
          </Link>
          {' '}•{' '}
          <Link to="/privacy" className="text-slate-400 hover:text-white underline">
            Privacy Policy
          </Link>
          {' '}•{' '}
          <Link to="/terms" className="text-slate-400 hover:text-white underline">
            Terms of Service
          </Link>
          {' '}•{' '}
          <Link to="/blog" className="text-slate-400 hover:text-white underline">
            Blog
          </Link>
        </p>
      </div>

    </div>
  )
}
