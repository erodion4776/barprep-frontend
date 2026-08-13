import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link }          from 'react-router-dom'
import { apiClient }     from '../api/client'
import { useProgress }   from '../context/ProgressContext'
import { BAR_TOPICS }    from '../context/ProgressContext'
import LoadingSpinner    from '../components/LoadingSpinner'

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl
                    overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-20" />
        <div className="h-5 bg-slate-200 rounded w-full" />
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-5/6" />
          <div className="h-3 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    </div>
  )
}

// ── Blog post card ────────────────────────────────────────────────────────────
function BlogCard({ post }) {
  const [imgError, setImgError] = useState(false)

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year:  'numeric',
        month: 'long',
        day:   'numeric',
      })
    : ''

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group bg-white border border-slate-200 rounded-2xl
                 overflow-hidden hover:shadow-lg hover:border-blue-200
                 transition-all duration-200 hover:-translate-y-0.5
                 flex flex-col"
    >
      {/* Cover image */}
      <div className="aspect-video bg-gradient-to-br from-blue-50
                      to-slate-100 overflow-hidden relative">
        {post.image_url && !imgError ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105
                       transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">⚖️</span>
          </div>
        )}

        {/* Topic badge overlay */}
        {post.topic && (
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-bold bg-blue-600/90 text-white
                             px-2.5 py-1 rounded-full backdrop-blur-sm">
              {post.topic}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 space-y-3">
        <h2 className="font-bold text-slate-900 text-base leading-snug
                       line-clamp-2 group-hover:text-blue-600
                       transition-colors">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 flex-1">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {formattedDate && <span>{formattedDate}</span>}
            {post.read_time > 0 && (
              <>
                <span>·</span>
                <span>{post.read_time} min read</span>
              </>
            )}
          </div>
          <span className="text-xs text-blue-600 font-medium
                           group-hover:underline">
            Read →
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Blog() {
  const { progress } = useProgress()

  const [posts,       setPosts]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error,       setError]       = useState('')
  const [activeTopic, setActiveTopic] = useState('')
  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(0)
  const [hasMore,     setHasMore]     = useState(true)

  const LIMIT = 12

  // SEO
  useEffect(() => {
    document.title = 'Bar Prep Blog — BarPrep AI'
  }, [])

  // ── Load posts ──────────────────────────────────────────────────────────────
  const loadPosts = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page
    if (reset) {
      setLoading(true)
      setPosts([])
      setPage(0)
    } else {
      setLoadingMore(true)
    }
    setError('')

    try {
      const res = await apiClient.getBlogPosts({
        page:   currentPage,
        limit:  LIMIT,
        topic:  activeTopic,
        search: search.trim(),
      })

      const newPosts = res.data.posts || []

      if (reset) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
        setPage(p => p + 1)
      }

      setHasMore(newPosts.length === LIMIT)
    } catch (err) {
      setError('Failed to load blog posts. Please try again.')
      console.error('Blog load error:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeTopic, search, page])

  // Load on mount
  useEffect(() => {
    loadPosts(true)
  }, [activeTopic])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // ── Personalized recommendation ─────────────────────────────────────────────
  const recommendedTopic = progress.weakTopics?.[0] || ''

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 space-y-8">

      {/* ── Header ── */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5
                        bg-blue-50 border border-blue-200 rounded-full
                        text-blue-700 text-xs font-bold">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          AI-Generated Daily
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Bar Prep Blog
        </h1>
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          Daily articles on bar exam topics, legal updates, and study strategies —
          written by AI, curated for you.
        </p>

        {/* Recommended topic banner */}
        {recommendedTopic && (
          <div className="inline-flex items-center gap-3 bg-amber-50
                          border border-amber-200 rounded-xl px-4 py-2.5
                          text-sm">
            <span className="text-amber-600 font-bold">⚠️ Recommended for you:</span>
            <button
              onClick={() => setActiveTopic(recommendedTopic)}
              className="text-amber-800 font-bold hover:underline"
            >
              Read about {recommendedTopic} →
            </button>
          </div>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-xl mx-auto">
        <span className="absolute left-4 top-1/2 -translate-y-1/2
                          text-slate-400 pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search articles by topic, title, or keyword..."
          className="w-full border border-slate-200 rounded-2xl pl-11 pr-10
                     py-3 text-sm focus:outline-none focus:border-blue-500
                     transition-colors bg-white shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2
                       text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Topic filter ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4
                      sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTopic('')}
          className={`px-4 py-2 rounded-full text-sm font-medium
            whitespace-nowrap transition-colors shrink-0
            ${activeTopic === ''
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }`}
        >
          All Topics
        </button>
        {BAR_TOPICS.map(topic => (
          <button
            key={topic}
            onClick={() => setActiveTopic(topic === activeTopic ? '' : topic)}
            className={`px-4 py-2 rounded-full text-sm font-medium
              whitespace-nowrap transition-colors shrink-0
              ${activeTopic === topic
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl
                        text-red-700 text-sm flex items-center
                        justify-between gap-3">
          <span>❌ {error}</span>
          <button
            onClick={() => loadPosts(true)}
            className="text-xs text-red-600 hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Posts grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">📰</div>
          <h2 className="text-lg font-bold text-slate-900">
            {search || activeTopic ? 'No articles found' : 'No posts yet'}
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {search || activeTopic
              ? 'Try different search terms or browse all topics.'
              : 'Check back soon — new articles are generated daily!'
            }
          </p>
          {(search || activeTopic) && (
            <button
              onClick={() => { setSearch(''); setActiveTopic('') }}
              className="px-4 py-2 text-sm text-blue-600 border
                         border-blue-200 rounded-xl hover:bg-blue-50
                         transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results count */}
          {(search || activeTopic) && (
            <p className="text-sm text-slate-500">
              {posts.length} article{posts.length !== 1 ? 's' : ''}
              {activeTopic ? ` about ${activeTopic}` : ''}
              {search ? ` matching "${search}"` : ''}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => loadPosts(false)}
                disabled={loadingMore}
                className="px-8 py-3 border border-slate-200 text-slate-600
                           font-medium rounded-xl hover:bg-slate-50
                           transition-colors disabled:opacity-60
                           flex items-center gap-2 mx-auto"
              >
                {loadingMore
                  ? <><LoadingSpinner size="sm" /> Loading…</>
                  : 'Load More Articles'
                }
              </button>
            </div>
          )}
        </>
      )}

      {/* ── AI Disclaimer ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl
                      p-4 text-center">
        <p className="text-xs text-amber-700">
          ⚠️ Blog articles are AI-generated for educational purposes only.
          Not reviewed by licensed attorneys. Always verify with official sources.{' '}
          <Link to="/disclaimer" className="underline hover:text-amber-900">
            Full Disclaimer
          </Link>
        </p>
      </div>

    </div>
  )
}
