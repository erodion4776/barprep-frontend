import { Link } from 'react-router-dom'

export default function About() {
  const features = [
    { icon: '🤖', title: 'AI-Powered Coaching',   desc: 'Ask any bar exam question and get detailed legal explanations powered by advanced AI.' },
    { icon: '📝', title: 'Mock Exam Practice',     desc: 'AI-generated MBE and MEE questions with instant grading and detailed explanations.' },
    { icon: '📅', title: 'Personalized Study Plan', desc: 'Enter your exam date and get a custom day-by-day study schedule based on your weak areas.' },
    { icon: '📊', title: 'Progress Analytics',     desc: 'Track your accuracy, pacing, and topic performance with detailed diagnostic reports.' },
    { icon: '📝', title: 'Assignment Analysis',    desc: 'Submit essays and memos for AI grading with detailed feedback and improvement suggestions.' },
    { icon: '🎥', title: 'Video Tutorials',        desc: 'Watch bar exam lecture videos with an AI coach that answers questions about each video.' },
  ]

  const values = [
    { icon: '🎯', title: 'Focused',      desc: 'Built specifically for bar exam prep — nothing more, nothing less.' },
    { icon: '🔒', title: 'Private',      desc: 'Your data belongs to you. We never sell it or use it for advertising.' },
    { icon: '💡', title: 'Intelligent',  desc: 'AI that learns your weaknesses and adapts its teaching to your needs.' },
    { icon: '📈', title: 'Results-Driven', desc: 'Every feature is designed with one goal: helping you pass the bar.' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-16">

      {/* Hero */}
      <div className="text-center space-y-6">
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
            one that's intelligent, personalized, and available 24/7.
          </p>
        </div>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/chat"
            className="btn-primary px-8 py-3 text-base">
            Try AI Coach →
          </Link>
          <Link to="/mock-exam"
            className="btn-secondary px-8 py-3 text-base">
            Take Mock Exam
          </Link>
        </div>
      </div>

      {/* Mission */}
      <div className="card bg-blue-600 text-white p-8 rounded-3xl space-y-4">
        <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">
          Our Mission
        </p>
        <h2 className="text-2xl font-black leading-tight">
          Make bar exam preparation accessible, intelligent, and effective
          for every aspiring attorney.
        </h2>
        <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">
          The bar exam is one of the most challenging professional tests in
          the world. Traditional prep courses are expensive, rigid, and
          one-size-fits-all. BarPrep AI uses artificial intelligence to
          give every student a personalized tutor that knows their
          weaknesses and teaches accordingly.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center">
          Everything You Need to Pass
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon, title, desc }) => (
            <div key={title}
              className="card p-5 hover:shadow-md transition-shadow space-y-3">
              <div className="text-3xl">{icon}</div>
              <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center">
          Our Values
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {values.map(({ icon, title, desc }) => (
            <div key={title}
              className="card bg-slate-50 border border-slate-200
                         p-5 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-bold text-slate-900">{title}</h3>
              </div>
              <p className="text-slate-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-2">
        <h3 className="font-bold text-amber-900 flex items-center gap-2">
          ⚠️ Important Disclaimer
        </h3>
        <p className="text-sm text-amber-800 leading-relaxed">
          BarPrep AI is an educational study tool powered by artificial intelligence.
          It is not a law firm, not affiliated with the NCBE, and does not provide
          legal advice. AI-generated content may contain errors. We do not guarantee
          bar exam results. Always verify important legal rules with official sources
          and use BarPrep AI to supplement — not replace — comprehensive bar prep programs.
        </p>
        <Link to="/disclaimer"
          className="text-xs text-amber-700 hover:underline font-medium">
          Read Full Disclaimer →
        </Link>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4 pb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Ready to Start Preparing?
        </h2>
        <p className="text-slate-500 text-sm">
          Join thousands of bar exam candidates studying smarter with AI.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/signup"
            className="btn-primary px-10 py-3 text-base">
            Create Free Account →
          </Link>
          <Link to="/faq"
            className="btn-secondary px-10 py-3 text-base">
            Read FAQ
          </Link>
        </div>
      </div>

    </div>
  )
}
