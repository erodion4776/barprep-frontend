import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon:  '🤖',
    title: 'AI-Powered Coaching',
    desc:  'Ask any bar exam question and get detailed legal explanations powered by advanced AI.',
    to:    '/chat',
  },
  {
    icon:  '📝',
    title: 'Mock Exam Practice',
    desc:  'AI-generated MBE and MEE questions with instant grading and detailed explanations.',
    to:    '/mock-exam',
  },
  {
    icon:  '📅',
    title: 'Personalized Study Plan',
    desc:  'Enter your exam date and get a custom day-by-day study schedule based on your weak areas.',
    to:    '/study',
  },
  {
    icon:  '📊',
    title: 'Progress Analytics',
    desc:  'Track your accuracy, pacing, and topic performance with detailed diagnostic reports.',
    to:    '/study',
  },
  {
    icon:  '✍️',
    title: 'Assignment Analysis',
    desc:  'Submit essays and memos for AI grading with detailed feedback and improvement suggestions.',
    to:    '/chat',
  },
  {
    icon:  '🎥',
    title: 'Video Tutorials',
    desc:  'Watch bar exam lecture videos with an AI coach that answers questions about each video.',
    to:    '/tutorials',
  },
  {
    icon:  '📰',
    title: 'Bar Prep Blog',
    desc:  'AI-curated articles, tips, and legal updates written fresh daily from live bar prep feeds.',
    to:    '/blog',
  },
]

const VALUES = [
  {
    icon:  '🎯',
    title: 'Focused',
    desc:  'Built specifically for bar exam prep — nothing more, nothing less.',
  },
  {
    icon:  '🔒',
    title: 'Private',
    desc:  'Your data belongs to you. We never sell it or use it for advertising.',
  },
  {
    icon:  '💡',
    title: 'Intelligent',
    desc:  'AI that learns your weaknesses and adapts its teaching to your needs.',
  },
  {
    icon:  '📈',
    title: 'Results-Driven',
    desc:  'Every feature is designed with one goal: helping you pass the bar.',
  },
]

const STATS = [
  { value: '10,000+', label: 'Questions Answered'  },
  { value: '50+',     label: 'Bar Topics Covered'  },
  { value: '24/7',    label: 'AI Always Available' },
  { value: '100%',    label: 'Free to Start'       },
]

// ── Fade-in hook ──────────────────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('opacity-100', 'translate-y-0')
          el.classList.remove('opacity-0', 'translate-y-6')
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

// ── Section wrapper with fade ─────────────────────────────────────────────────
function FadeSection({ children, className = '' }) {
  const ref = useFadeIn()
  return (
    <div
      ref={ref}
      className={`
        opacity-0 translate-y-6
        transition-all duration-700 ease-out
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function About() {

  // SEO
  useEffect(() => {
    document.title = 'About BarPrep AI — Your AI-Powered Bar Exam Coach'
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-16">

      {/* ── Hero ── */}
      <FadeSection className="text-center space-y-6">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center
                        justify-center mx-auto shadow-lg">
          <span className="text-white font-black text-2xl">B</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900">
            About BarPrep <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            We built the bar exam study tool we wished existed —
            intelligent, personalized, and available 24/7.
          </p>
        </div>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/chat"
            className="px-8 py-3 text-base font-bold bg-blue-600
                       text-white rounded-xl hover:bg-blue-700
                       transition-colors shadow-lg shadow-blue-600/20"
          >
            Try AI Coach →
          </Link>
          <Link
            to="/mock-exam"
            className="px-8 py-3 text-base font-bold border
                       border-slate-200 text-slate-700 rounded-xl
                       hover:bg-slate-50 transition-colors"
          >
            Take Mock Exam
          </Link>
        </div>
      </FadeSection>

      {/* ── Stats Bar ── */}
      <FadeSection>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="text-center bg-white border border-slate-200
                         rounded-2xl p-4 shadow-sm"
            >
              <p className="text-2xl font-black text-blue-600">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* ── Mission ── */}
      <FadeSection>
        <div className="bg-blue-600 text-white p-8 rounded-3xl space-y-4">
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">
            Our Mission
          </p>
          <h2 className="text-2xl font-black leading-tight">
            Make bar exam preparation accessible, intelligent, and effective
            for every aspiring attorney.
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">
            The bar exam is one of the most challenging professional tests
            in the world. Traditional prep courses are expensive, rigid,
            and one-size-fits-all. BarPrep AI uses artificial intelligence
            to give every student a personalized tutor that knows their
            weaknesses and teaches accordingly.
          </p>
          <Link
            to="/blog"
            className="inline-block mt-2 text-sm font-bold text-white
                       bg-white/20 hover:bg-white/30 px-4 py-2
                       rounded-lg transition-colors"
          >
            📰 Read Our Bar Prep Blog →
          </Link>
        </div>
      </FadeSection>

      {/* ── Features ── */}
      <FadeSection className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center">
          Everything You Need to Pass
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, desc, to }) => (
            <Link
              key={title}
              to={to}
              className="group bg-white border border-slate-200 rounded-2xl
                         p-5 hover:shadow-md hover:border-blue-200
                         transition-all duration-200 space-y-3"
            >
              <div className="text-3xl group-hover:scale-110
                              transition-transform duration-200 w-fit">
                {icon}
              </div>
              <h3 className="font-bold text-slate-900 text-sm
                             group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </FadeSection>

      {/* ── Values ── */}
      <FadeSection className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center">
          Our Values
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-slate-50 border border-slate-200
                         rounded-2xl p-5 space-y-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-bold text-slate-900">{title}</h3>
              </div>
              <p className="text-slate-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* ── Team Note ── */}
      <FadeSection>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl
                        p-6 text-center space-y-3">
          <p className="text-3xl">👨‍⚖️</p>
          <h3 className="font-bold text-slate-900">
            Built by People Who Understand the Struggle
          </h3>
          <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            BarPrep AI was created by a team of legal professionals and
            engineers who experienced first-hand how inaccessible
            quality bar prep resources are. Our goal is to level the
            playing field so every candidate — regardless of background
            or budget — has access to a world-class study experience.
          </p>
          <Link
            to="/contact"
            className="inline-block text-sm text-blue-600
                       hover:underline font-medium"
          >
            Get in Touch →
          </Link>
        </div>
      </FadeSection>

      {/* ── Disclaimer ── */}
      <FadeSection>
        <div className="bg-amber-50 border border-amber-200
                        rounded-2xl p-6 space-y-2">
          <h3 className="font-bold text-amber-900 flex items-center gap-2">
            ⚠️ Important Disclaimer
          </h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            BarPrep AI is an educational study tool powered by artificial
            intelligence. It is not a law firm, not affiliated with the
            NCBE, and does not provide legal advice. AI-generated content
            may contain errors. We do not guarantee bar exam results.
            Always verify important legal rules with official sources and
            use BarPrep AI to supplement — not replace — comprehensive
            bar prep programs.
          </p>
          <Link
            to="/disclaimer"
            className="text-xs text-amber-700 hover:underline font-medium"
          >
            Read Full Disclaimer →
          </Link>
        </div>
      </FadeSection>

      {/* ── CTA ── */}
      <FadeSection className="text-center space-y-4 pb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Ready to Start Preparing?
        </h2>
        <p className="text-slate-500 text-sm">
          Join thousands of bar exam candidates studying smarter with AI.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/signup"
            className="px-10 py-3 text-base font-bold bg-blue-600
                       text-white rounded-xl hover:bg-blue-700
                       transition-colors shadow-lg shadow-blue-600/20"
          >
            Create Free Account →
          </Link>
          <Link
            to="/blog"
            className="px-10 py-3 text-base font-bold border
                       border-slate-200 text-slate-700 rounded-xl
                       hover:bg-slate-50 transition-colors"
          >
            Read the Blog
          </Link>
        </div>
      </FadeSection>

    </div>
  )
}
