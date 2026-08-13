import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function Blog() {
  useEffect(() => {
    document.title = 'Blog — BarPrep AI'
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="text-6xl">📰</div>
      <h1 className="text-3xl font-black text-slate-900">
        Bar Prep Blog
      </h1>
      <p className="text-slate-500 text-lg max-w-xl mx-auto">
        Daily AI-generated articles on bar exam topics, study strategies,
        and legal updates. Coming soon.
      </p>
      <div className="flex justify-center gap-4 flex-wrap">
        <Link
          to="/chat"
          className="px-6 py-3 bg-blue-600 text-white font-bold
                     rounded-xl hover:bg-blue-700 transition-colors"
        >
          Ask AI Coach →
        </Link>
        <Link
          to="/mock-exam"
          className="px-6 py-3 border border-slate-200 text-slate-600
                     font-bold rounded-xl hover:bg-slate-50 transition-colors"
        >
          Take Mock Exam
        </Link>
      </div>
    </div>
  )
}
