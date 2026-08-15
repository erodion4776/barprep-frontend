import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link }            from 'react-router-dom'
import { apiClient }       from '../api/client'
import LoadingSpinner      from '../components/LoadingSpinner'
import { useProgress }     from '../context/ProgressContext'
import { useSubscription } from '../context/SubscriptionContext'

const ALL = 'All Topics'

const TOPIC_ORDER = [
  'Constitutional Law', 'Contracts',    'Torts',
  'Criminal Law',       'Civil Procedure', 'Evidence',
  'Real Property',      'Business Associations',
  'Family Law',         'Wills & Trusts',
]

const SORT_OPTIONS = [
  { value: 'order',  label: 'Course Order' },
  { value: 'newest', label: 'Newest First' },
  { value: 'title',  label: 'A → Z'        },
]

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-20" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-5/6" />
        </div>
      </div>
    </div>
  )
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────
function Thumbnail({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center
                      bg-gradient-to-br from-slate-100 to-slate-200">
        <span className="text-5xl">▶️</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}

// ── Module card ───────────────────────────────────────────────────────────────
function ModuleCard({ module, isWatched, isFree }) {
  return (
    <Link
      to={`/tutorials/${module.id}`}
      className="group bg-white border border-slate-200 rounded-2xl
                 overflow-hidden hover:shadow-lg hover:border-blue-200
                 hover:-translate-y-0.5 transition-all duration-200
                 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative bg-slate-100 aspect-video overflow-hidden">
        <Thumbnail src={module.thumbnail_url} alt={module.title} />

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center
                        justify-center opacity-0 group-hover:opacity-100
                        transition-opacity duration-200">
          <div className="w-12 h-12 bg-white/90 rounded-full flex
                          items-center justify-center shadow-lg">
            <span className="text-blue-600 text-lg ml-1">▶</span>
          </div>
        </div>

        {/* Watched badge */}
        {isWatched && (
          <div className="absolute top-2 right-2 bg-green-500 text-white
                          text-[10px] font-bold px-2 py-0.5 rounded-full">
            ✓ Watched
          </div>
        )}

        {/* Order index */}
        {module.order_index !== undefined && (
          <div className="absolute top-2 left-2 bg-black/50 text-white
                          text-[10px] font-bold px-2 py-0.5 rounded-full">
            #{module.order_index + 1}
          </div>
        )}

        {/* Free plan AI locked badge */}
        {isFree && (
          <div className="absolute bottom-2 right-2 bg-amber-500/90 text-white
                          text-[10px] font-bold px-2 py-0.5 rounded-full
                          flex items-center gap-1">
            🤖 AI Chat — Pro
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <span className="inline-block text-xs font-bold px-2 py-0.5
                         bg-blue-100 text-blue-700 rounded-full w-fit mb-2">
          {module.topic}
        </span>

        <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-2
                       group-hover:text-blue-600 transition-colors">
          {module.title}
        </h3>

        {module.ai_summary && (
          <p className="text-xs text-slate-500 line-clamp-3 flex-1">
            {module.ai_summary}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-blue-600 text-xs font-medium group-hover:underline">
            Watch Free →
          </span>
          <div className="flex items-center gap-2">
            {isWatched && (
              <span className="text-[10px] text-green-600 font-medium">
                ✅ Watched
              </span>
            )}
            {isFree && (
              <span className="text-[10px] text-amber-600 font-medium">
                🔒 AI Chat
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Tutorials() {
  const { progress }          = useProgress()
  const { isFree }            = useSubscription()

  const [allModules,  setAllModules]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [activeTopic, setActiveTopic] = useState(ALL)
  const [sortBy,      setSortBy]      = useState('order')
  const [search,      setSearch]      = useState('')

  // ── Watched module IDs ─────────────────────────────────────────────────────
  const watchedIds = useMemo(
    () => new Set(progress.watchedModules.map(m => m.module_id || m.id)),
    [progress.watchedModules]
  )

  // ── Load ALL modules once ──────────────────────────────────────────────────
  const loadModules = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.getModules('', false)
      setAllModules(res.data.modules || [])
    } catch {
      setError('Failed to load tutorials. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadModules() }, [loadModules])

  // ── Filter + sort + search ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...allModules]

    if (activeTopic !== ALL) {
      result = result.filter(m => m.topic === activeTopic)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        m =>
          m.title?.toLowerCase().includes(q) ||
          m.ai_summary?.toLowerCase().includes(q) ||
          m.topic?.toLowerCase().includes(q)
      )
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title?.localeCompare(b.title))
    } else {
      result.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    }

    return result
  }, [allModules, activeTopic, search, sortBy])

  // ── Topic counts ───────────────────────────────────────────────────────────
  const topicCounts = useMemo(() => {
    const counts = {}
    allModules.forEach(m => {
      counts[m.topic] = (counts[m.topic] || 0) + 1
    })
    return counts
  }, [allModules])

  // ── Grouped view ───────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    if (activeTopic !== ALL || search.trim()) return null
    const g = {}
    filtered.forEach(m => {
      const t = m.topic || 'General'
      if (!g[t]) g[t] = []
      g[t].push(m)
    })
    return Object.fromEntries(
      Object.entries(g).sort(([a], [b]) => {
        const ai = TOPIC_ORDER.indexOf(a)
        const bi = TOPIC_ORDER.indexOf(b)
        if (ai === -1 && bi === -1) return a.localeCompare(b)
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })
    )
  }, [filtered, activeTopic, search])

  const watchedCount = allModules.filter(m => watchedIds.has(m.id)).length

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Video Tutorials
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            All videos are free to watch. Upgrade to Pro to unlock
            the AI coach on each video.
          </p>
          {!loading && allModules.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              {allModules.length} tutorial
              {allModules.length !== 1 ? 's' : ''} available
              {watchedCount > 0 && (
                <span className="text-green-600 ml-2">
                  • {watchedCount} watched
                </span>
              )}
            </p>
          )}
        </div>

        {/* Sort */}
        {!loading && allModules.length > 0 && (
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm
                       text-slate-600 focus:outline-none focus:border-blue-500
                       bg-white"
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Free plan info banner ── */}
      {isFree && !loading && allModules.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4
                        flex flex-col sm:flex-row items-start sm:items-center
                        justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🎥</span>
            <div>
              <p className="text-sm font-bold text-slate-900">
                All videos are free to watch!
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Upgrade to Pro to unlock the <strong>AI Coach chat</strong> on
                every video — ask questions and get answers in real time.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <Link
              to="/pricing"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white
                         text-xs font-bold rounded-xl hover:bg-blue-700
                         transition-colors text-center"
            >
              🤖 Unlock AI Chat →
            </Link>
            <Link
              to="/pricing"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-600 text-white
                         text-xs font-bold rounded-xl hover:bg-purple-700
                         transition-colors text-center"
            >
              👑 Bar Ready
            </Link>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tutorials by title, topic, or content…"
          className="w-full border border-slate-200 rounded-xl pl-10 pr-4
                     py-2.5 text-sm focus:outline-none focus:border-blue-500
                     transition-colors bg-white"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2
                          text-slate-400 text-sm pointer-events-none">
          🔍
        </span>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Topic filter pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4
                      sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTopic(ALL)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium
            whitespace-nowrap transition-colors shrink-0
            ${activeTopic === ALL
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }
          `}
        >
          All Topics
          {!loading && (
            <span className="ml-1.5 text-xs opacity-70">({allModules.length})</span>
          )}
        </button>

        {TOPIC_ORDER.map(topic => (
          <button
            key={topic}
            onClick={() => setActiveTopic(topic)}
            disabled={!topicCounts[topic]}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              whitespace-nowrap transition-colors shrink-0
              ${activeTopic === topic
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }
              ${!topicCounts[topic] ? 'opacity-40 cursor-default' : ''}
            `}
          >
            {topic}
            {topicCounts[topic] && (
              <span className="ml-1.5 text-xs opacity-70">
                ({topicCounts[topic]})
              </span>
            )}
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
            onClick={loadModules}
            className="text-red-600 hover:underline text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading ? (
        <div className="space-y-8">
          {[1, 2].map(g => (
            <div key={g} className="space-y-4">
              <div className="h-6 bg-slate-200 rounded w-40 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            </div>
          ))}
        </div>

      /* ── Empty state ── */
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl
                        text-center py-16 space-y-3">
          {allModules.length === 0 ? (
            <>
              <div className="text-4xl">📚</div>
              <h2 className="text-lg font-semibold text-slate-900">
                No Tutorials Yet
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Tutorials will appear here once the admin adds YouTube
                lecture videos. Check back soon!
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl">🔍</div>
              <h2 className="text-lg font-semibold text-slate-900">
                No results found
              </h2>
              <p className="text-slate-500 text-sm">
                Try a different search term or topic filter.
              </p>
              <button
                onClick={() => { setSearch(''); setActiveTopic(ALL) }}
                className="px-4 py-2 text-sm text-blue-600 border
                           border-blue-200 rounded-xl hover:bg-blue-50
                           transition-colors"
              >
                Clear filters
              </button>
            </>
          )}
        </div>

      /* ── Modules ── */
      ) : grouped ? (
        /* Grouped by topic */
        <div className="space-y-10">
          {Object.entries(grouped).map(([topic, topicModules]) => (
            <div key={topic}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-slate-900">{topic}</h2>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-100
                                 text-blue-700 rounded-full">
                  {topicModules.length} video{topicModules.length !== 1 ? 's' : ''}
                </span>
                {topicModules.some(m => watchedIds.has(m.id)) && (
                  <span className="text-xs text-green-600 font-medium">
                    ✅ {topicModules.filter(m => watchedIds.has(m.id)).length} watched
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topicModules.map(module => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    isWatched={watchedIds.has(module.id)}
                    isFree={isFree}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Upgrade CTA for free users */}
          {isFree && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-700
                            rounded-2xl p-6 sm:p-8 text-white text-center space-y-4">
              <div className="text-4xl">🤖</div>
              <h2 className="text-xl font-black">
                Unlock AI Coach on Every Video
              </h2>
              <p className="text-blue-100 text-sm max-w-md mx-auto">
                All videos are free to watch. Upgrade to Pro to ask the AI
                coach questions about any lecture in real time — get instant
                explanations, quizzes, and legal breakdowns.
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link
                  to="/pricing"
                  className="px-8 py-3 bg-white text-blue-700 font-black
                             rounded-2xl hover:bg-blue-50 transition-colors text-sm"
                >
                  🚀 Pro — $100/month
                </Link>
                <Link
                  to="/pricing"
                  className="px-8 py-3 bg-purple-500 text-white font-black
                             rounded-2xl hover:bg-purple-400 transition-colors text-sm
                             border border-purple-400"
                >
                  👑 Bar Ready — $400/year
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Flat grid */
        <div>
          {search.trim() && (
            <p className="text-sm text-slate-500 mb-4">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                isWatched={watchedIds.has(module.id)}
                isFree={isFree}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
