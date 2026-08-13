import { Link, useParams } from 'react-router-dom'

export default function BlogPost() {
  const { slug } = useParams()

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="text-6xl">📄</div>
      <h1 className="text-2xl font-black text-slate-900">
        Blog Post Coming Soon
      </h1>
      <p className="text-slate-500 text-sm">
        Slug: <code className="bg-slate-100 px-2 py-1 rounded">{slug}</code>
      </p>
      <Link
        to="/blog"
        className="inline-block px-6 py-3 bg-blue-600 text-white
                   font-bold rounded-xl hover:bg-blue-700 transition-colors"
      >
        ← Back to Blog
      </Link>
    </div>
  )
}
