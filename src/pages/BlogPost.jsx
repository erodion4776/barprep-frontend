import { useState, useEffect }  from 'react'
import { useParams, Link }      from 'react-router-dom'
import ReactMarkdown            from 'react-markdown'
import remarkGfm                from 'remark-gfm'
import { apiClient }            from '../api/client'
import LoadingSpinner           from '../components/LoadingSpinner'

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="text-xs text-slate-400 hover:text-slate-600
                 transition-colors flex items-center gap-1"
    >
      {copied ? '✅ Copied' : '📋 Copy'}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BlogPost() {
  const { slug } = useParams()

  const [post,    setPost]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!slug) return
    loadPost()
  }, [slug])

  const loadPost = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.getBlogPost(slug)
      const p   = res.data.post
      setPost(p)
      document.title = `${p.title} — BarPrep AI Blog`
    } catch (err) {
      setError(err.message || 'Failed to load blog post.')
      document.title = 'Post Not Found — BarPrep AI'
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading article..." />
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4 px-4">
        <div className="text-5xl">📄</div>
        <h1 className="text-2xl font-black text-slate-900">
          Article Not Found
        </h1>
        <p className="text-slate-500 text-sm">
          This article may have been removed or the link is incorrect.
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

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/"    className="hover:text-blue-600 transition-colors">Home</Link>
        <span>→</span>
        <Link to="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
        <span>→</span>
        <span className="text-slate-700 truncate max-w-[200px]">{post.title}</span>
      </div>

      {/* ── Header ── */}
      <div className="space-y-4">
        {/* Topic badge */}
        {post.topic && (
          <Link
            to={`/blog?topic=${encodeURIComponent(post.topic)}`}
            className="inline-block text-xs font-bold px-3 py-1
                       bg-blue-100 text-blue-700 rounded-full
                       hover:bg-blue-200 transition-colors"
          >
            {post.topic}
          </Link>
        )}

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900
                       leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-slate-500 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between flex-wrap gap-3
                        py-3 border-t border-b border-slate-100">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 bg-blue-600 rounded-full
                               flex items-center justify-center
                               text-white text-[10px] font-bold">
                AI
              </span>
              <span>BarPrep AI</span>
            </div>
            {formattedDate && <span>{formattedDate}</span>}
            {post.read_time > 0 && (
              <span>{post.read_time} min read</span>
            )}
            {post.views > 0 && (
              <span>{post.views.toLocaleString()} views</span>
            )}
          </div>

          <CopyButton text={`${window.location.origin}/blog/${post.slug}`} />
        </div>
      </div>

      {/* ── Cover image ── */}
      {post.image_url && !imgError && (
        <div className="rounded-2xl overflow-hidden aspect-video
                        bg-gradient-to-br from-blue-50 to-slate-100">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      {/* ── AI Disclaimer ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl
                      p-3 flex items-start gap-2">
        <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
        <p className="text-xs text-amber-700">
          <span className="font-bold">AI-Generated Content:</span> This article
          was written by AI for educational purposes. Not reviewed by licensed
          attorneys. Always verify legal information with official sources.{' '}
          <Link to="/disclaimer" className="underline hover:text-amber-900">
            Full Disclaimer
          </Link>
        </p>
      </div>

      {/* ── Article content ── */}
      <article className="prose prose-slate max-w-none
                          prose-headings:font-bold
                          prose-headings:text-slate-900
                          prose-h2:text-2xl
                          prose-h3:text-xl
                          prose-p:text-slate-600
                          prose-p:leading-relaxed
                          prose-a:text-blue-600
                          prose-a:no-underline
                          hover:prose-a:underline
                          prose-strong:text-slate-800
                          prose-code:bg-slate-100
                          prose-code:px-1.5
                          prose-code:py-0.5
                          prose-code:rounded
                          prose-code:text-slate-800
                          prose-pre:bg-slate-900
                          prose-pre:rounded-2xl
                          prose-blockquote:border-blue-300
                          prose-blockquote:bg-blue-50
                          prose-blockquote:rounded-r-xl
                          prose-blockquote:not-italic
                          prose-li:text-slate-600
                          prose-img:rounded-2xl
                          prose-img:shadow-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </article>

      {/* ── Share ── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl
                      p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Share this article
        </h3>
        <div className="flex gap-3 flex-wrap">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-black text-white text-xs font-bold
                       rounded-xl hover:bg-slate-800 transition-colors"
          >
            𝕏 Share on X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-700 text-white text-xs font-bold
                       rounded-xl hover:bg-blue-800 transition-colors"
          >
            in Share on LinkedIn
          </a>
          <CopyButton text={window.location.href} />
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 text-white
                      space-y-4 text-center">
        <h2 className="text-xl font-black">
          Ready to Practice {post.topic || 'This Topic'}?
        </h2>
        <p className="text-blue-100 text-sm">
          Put this knowledge to the test with AI-generated mock exam questions.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            to="/mock-exam"
            className="px-6 py-2.5 bg-white text-blue-700 font-bold
                       text-sm rounded-xl hover:bg-blue-50 transition-colors"
          >
            📝 Take Mock Exam →
          </Link>
          <Link
            to="/chat"
            className="px-6 py-2.5 bg-blue-500 text-white font-bold
                       text-sm rounded-xl hover:bg-blue-400 transition-colors
                       border border-blue-400"
          >
            🤖 Ask AI Coach →
          </Link>
        </div>
      </div>

      {/* ── Back to blog ── */}
      <div className="text-center pb-8">
        <Link
          to="/blog"
          className="text-sm text-slate-500 hover:text-slate-700
                     transition-colors font-medium"
        >
          ← Back to Blog
        </Link>
      </div>

    </div>
  )
}
