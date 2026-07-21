import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../api/client'

// ── Animated Counter Hook ────────────────────────────────────────
function useCounter(end, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, start])
  return count
}

// ── Intersection Observer Hook ───────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ── Typing Animation Hook ────────────────────────────────────────
function useTypingAnimation(texts, speed = 80) {
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex]     = useState(0)
  const [charIndex, setCharIndex]     = useState(0)
  const [deleting, setDeleting]       = useState(false)

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

// ── FAQ Item ─────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all
                     duration-300 ${open
                       ? 'border-blue-200 bg-blue-50/30'
                       : 'border-slate-200 bg-white'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between
                   p-5 text-left gap-4">
        <span className="font-semibold text-slate-900 text-sm sm:text-base">
          {q}
        </span>
        <span className={`text-blue-600 text-xl font-bold shrink-0
                          transition-transform duration-300
                          ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed
                        border-t border-slate-100 pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

// ── Main Landing Page ────────────────────────────────────────────
export default function LandingPage() {
  const navigate                        = useNavigate()
  const [user, setUser]                 = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [statsRef, statsInView]         = useInView()

  const typingText = useTypingAnimation([
    'Pass the Bar Exam',
    'Master Legal Rules',
    'Ace MBE Questions',
    'Build Confidence',
    'Study Smarter',
  ])

  const studentsCount  = useCounter(12000,  2500, statsInView)
  const questionsCount = useCounter(500000, 2500, statsInView)
  const passRateCount  = useCounter(94,     2000, statsInView)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, session) => setUser(session?.user ?? null)
    )
    return () => subscription?.unsubscribe()
  }, [])

  const handleCTA = () => {
    if (user) navigate('/dashboard')
    else navigate('/login')
  }

  // ── Data ───────────────────────────────────────────────────────
  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Get started with the basics',
      color: 'border-slate-200',
      badge: null,
      features: [
        { text: '10 AI chat messages/day',          included: true  },
        { text: '5 mock exam questions/day',         included: true  },
        { text: 'Basic progress tracking',           included: true  },
        { text: 'Access to tutorials',               included: true  },
        { text: 'Personalized study plan',           included: false },
        { text: 'Unlimited mock exams',              included: false },
        { text: 'Assignment AI analysis',            included: false },
        { text: 'Advanced analytics',                included: false },
        { text: 'Priority support',                  included: false },
      ],
      cta: 'Get Started Free',
      ctaStyle: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    },
    {
      name: 'Pro',
      price: { monthly: 90, yearly: 79 },
      description: 'Everything you need to pass',
      color: 'border-blue-600',
      badge: '🔥 Most Popular',
      features: [
        { text: 'Unlimited AI coaching sessions',    included: true  },
        { text: 'Unlimited mock exam questions',     included: true  },
        { text: 'Full progress analytics',           included: true  },
        { text: 'All video tutorials',               included: true  },
        { text: 'AI personalized study plan',        included: true  },
        { text: 'Assignment AI grading & feedback',  included: true  },
        { text: 'Advanced topic diagnostics',        included: true  },
        { text: 'Priority email support',            included: true  },
        { text: 'Exam day readiness report',         included: true  },
      ],
      cta: 'Start Pro — $90/mo',
      ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200',
    },
    {
      name: 'Bar Ready',
      price: { monthly: 149, yearly: 129 },
      description: 'Maximum prep, maximum results',
      color: 'border-purple-500',
      badge: '👑 Best Value',
      features: [
        { text: 'Everything in Pro',                 included: true  },
        { text: '1-on-1 AI tutoring sessions',       included: true  },
        { text: 'Full MEE essay grading',            included: true  },
        { text: 'Simulated full bar exam',           included: true  },
        { text: 'Personalized weakness drills',      included: true  },
        { text: 'Study group access',                included: true  },
        { text: 'Flashcard system',                  included: true  },
        { text: 'Lifetime access to materials',      included: true  },
        { text: 'Pass guarantee or money back',      included: true  },
      ],
      cta: 'Go Bar Ready',
      ctaStyle: 'bg-purple-600 text-white hover:bg-purple-700 shadow-xl shadow-purple-200',
    },
  ]

  const features = [
    {
      icon: '🤖',
      title: 'AI Coach That Knows You',
      desc: 'Your AI coach reads your exam history, identifies weak spots, and teaches exactly what you need — not a generic curriculum.',
      color: 'bg-blue-50 border-blue-100',
      iconBg: 'bg-blue-600',
    },
    {
      icon: '📝',
      title: 'Realistic Mock Exams',
      desc: 'AI-generated MBE questions with real exam pacing, instant grading, and detailed legal explanations for every answer.',
      color: 'bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-600',
    },
    {
      icon: '📅',
      title: 'Personalized Study Plan',
      desc: 'Enter your exam date. The AI builds a day-by-day schedule prioritizing your weakest topics and adjusts as you improve.',
      color: 'bg-green-50 border-green-100',
      iconBg: 'bg-green-600',
    },
    {
      icon: '📊',
      title: 'Deep Analytics',
      desc: 'Track accuracy by topic, monitor pacing, identify patterns in wrong answers, and see your bar exam readiness score.',
      color: 'bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-500',
    },
    {
      icon: '✍️',
      title: 'Assignment AI Grader',
      desc: 'Submit essays and legal memos. The AI grades them using bar exam rubrics and gives specific, actionable feedback.',
      color: 'bg-rose-50 border-rose-100',
      iconBg: 'bg-rose-600',
    },
    {
      icon: '🎥',
      title: 'Interactive Tutorials',
      desc: 'Watch bar exam lectures with a built-in AI coach that answers questions about the video content in real time.',
      color: 'bg-indigo-50 border-indigo-100',
      iconBg: 'bg-indigo-600',
    },
  ]

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Passed July 2024 Bar',
      state: 'California',
      avatar: 'SM',
      color: 'bg-blue-600',
      text: 'I failed the bar twice before finding BarPrep AI. The personalized study plan identified that Contracts and Evidence were killing me. Three months later — I passed. The AI coaching is like having a brilliant tutor available at 3am.',
      score: '272/400 MBE Score',
    },
    {
      name: 'James T.',
      role: 'First-time Passer',
      state: 'New York',
      avatar: 'JT',
      color: 'bg-purple-600',
      text: 'The mock exams are incredibly realistic. The AI explanations for wrong answers taught me more than weeks of reading outlines. I went from 45% accuracy to 78% in six weeks. Worth every penny.',
      score: '286/400 MBE Score',
    },
    {
      name: 'Priya K.',
      role: 'Passed February 2024',
      state: 'Texas',
      avatar: 'PK',
      color: 'bg-green-600',
      text: 'As a working mom with limited study time, the daily study plan was a game-changer. I studied 2 hours a day and the AI made every minute count by focusing on exactly what I needed. I passed on my first attempt!',
      score: '268/400 MBE Score',
    },
    {
      name: 'Marcus R.',
      role: 'Passed July 2024',
      state: 'Florida',
      avatar: 'MR',
      color: 'bg-amber-600',
      text: 'The assignment analysis feature is extraordinary. I submitted my practice essays and the AI gave me better feedback than some professors. My essay scores went from a 3 to a 5.5 average.',
      score: '279/400 MBE Score',
    },
  ]

  const faqs = [
    {
      q: 'Is BarPrep AI a replacement for Barbri or Themis?',
      a: 'BarPrep AI is designed to be a powerful supplement to traditional bar prep courses. While it covers all MBE and MEE topics with AI-powered coaching, we recommend using it alongside — not instead of — an accredited bar prep program for maximum results.',
    },
    {
      q: 'How does the AI know what I need to study?',
      a: 'Every time you answer a mock exam question, the AI tracks your performance by topic, accuracy, and speed. It builds a detailed profile of your strengths and weaknesses and uses this to personalize your study plan, AI coaching responses, and question recommendations.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes, absolutely. There are no long-term contracts. You can cancel your subscription at any time from your account settings and you will retain access until the end of your billing period.',
    },
    {
      q: 'What does the $90/month plan include?',
      a: 'The Pro plan ($90/month) includes unlimited AI coaching sessions, unlimited mock exam questions, personalized study plans, assignment AI grading and feedback, full progress analytics, all video tutorials with interactive AI, and priority email support.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes! The Free plan lets you experience BarPrep AI with 10 AI chat messages per day and 5 mock exam questions per day at no cost. Upgrade to Pro anytime to unlock unlimited access.',
    },
    {
      q: 'What bar exams does BarPrep AI cover?',
      a: 'BarPrep AI covers all 10 MBE subjects (Constitutional Law, Contracts, Torts, Criminal Law, Civil Procedure, Evidence, Real Property, Business Associations, Family Law, and Wills & Trusts) as well as MEE essay topics for the Uniform Bar Exam (UBE).',
    },
    {
      q: 'Is BarPrep AI a law firm or legal service?',
      a: 'No. BarPrep AI is an educational study platform powered by AI. It does not provide legal advice and is not affiliated with the NCBE, any state bar association, or accredited law schools.',
    },
    {
      q: 'Does the yearly plan save money?',
      a: 'Yes! The yearly plan for Pro is $79/month (billed annually at $948), saving you $132 compared to monthly billing. The Bar Ready yearly plan is $129/month (billed annually at $1,548).',
    },
  ]

  const topics = [
    'Constitutional Law', 'Contracts', 'Torts',
    'Criminal Law', 'Civil Procedure', 'Evidence',
    'Real Property', 'Business Associations',
    'Family Law', 'Wills & Trusts',
  ]

  return (
    <div className="overflow-x-hidden">

      {/* ════════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen bg-gradient-to-br
                          from-slate-900 via-blue-950 to-slate-900
                          flex items-center justify-center
                          overflow-hidden px-4 py-20">

        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96
                          bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80
                          bg-purple-600/20 rounded-full blur-3xl animate-pulse"
               style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64
                          bg-indigo-600/10 rounded-full blur-3xl animate-pulse"
               style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{
               backgroundImage: `linear-gradient(#fff 1px, transparent 1px),
                                 linear-gradient(90deg, #fff 1px, transparent 1px)`,
               backgroundSize: '50px 50px',
             }} />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2
                          bg-blue-600/20 border border-blue-500/30
                          rounded-full text-blue-300 text-sm font-medium
                          backdrop-blur-sm">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Bar Exam Preparation Platform
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black
                           text-white leading-tight tracking-tight">
              Use AI To
              <br />
              <span className="text-transparent bg-clip-text
                               bg-gradient-to-r from-blue-400
                               via-purple-400 to-blue-400">
                {typingText}
                <span className="text-blue-400 animate-pulse">|</span>
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400
                          max-w-2xl mx-auto leading-relaxed">
              Your personal AI bar exam coach that knows your weaknesses,
              builds your study plan, grades your essays, and coaches you
              24/7 until you pass.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center
                          justify-center gap-4">
            <button
              onClick={handleCTA}
              className="w-full sm:w-auto px-10 py-4 bg-blue-600
                         text-white text-lg font-bold rounded-2xl
                         hover:bg-blue-500 transition-all duration-200
                         shadow-2xl shadow-blue-900/50
                         hover:shadow-blue-500/30 hover:-translate-y-0.5
                         active:scale-[0.98]">
              Try Now — It's Free →
            </button>
            <a href="#pricing"
              className="w-full sm:w-auto px-10 py-4 border
                         border-slate-600 text-slate-300 text-lg
                         font-bold rounded-2xl hover:border-blue-500
                         hover:text-white transition-all duration-200
                         text-center">
              View Pricing
            </a>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6
                          flex-wrap text-slate-500 text-xs">
            {[
              '✅ No credit card required',
              '✅ Cancel anytime',
              '✅ GDPR compliant',
              '✅ 24/7 AI access',
            ].map(t => (
              <span key={t} className="font-medium">{t}</span>
            ))}
          </div>

          {/* Floating UI Preview */}
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

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-green-500
                            text-white text-xs font-bold px-3 py-1.5
                            rounded-full shadow-lg animate-bounce">
              ✅ Just answered!
            </div>
            <div className="absolute -bottom-4 -left-4 bg-blue-600
                            text-white text-xs font-bold px-3 py-1.5
                            rounded-full shadow-lg">
              📊 94% pass rate
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STATS SECTION
      ════════════════════════════════════════════════════════════ */}
      <section ref={statsRef} className="bg-blue-600 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                value: `${studentsCount.toLocaleString()}+`,
                label: 'Students Studying',
                sub:   
