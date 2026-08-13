import { useState, useEffect, useCallback } from 'react'
import { useNavigate }                       from 'react-router-dom'
import { apiClient, supabase }               from '../api/client'
import LoadingSpinner                        from '../components/LoadingSpinner'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOPICS = [
  'Constitutional Law', 'Contracts',    'Torts',
  'Criminal Law',       'Civil Procedure', 'Evidence',
  'Real Property',      'Business Associations',
  'Family Law',         'Wills & Trusts',
]

const TABS = [
  { id: 'videos',  label: 'Videos',       icon: '🎥' },
  { id: 'web',     label: 'Web Pages',    icon: '🌐' },
  { id: 'pdf',     label: 'PDF Upload',   icon: '📄' },
  { id: 'modules', label: 'Modules',      icon: '📚' },
  { id: 'scraper', label: 'Scraper',      icon: '🕷️' },
  { id: 'blog',    label: 'Blog',         icon: '📰' },
  { id: 'users',   label: 'Users',        icon: '👥' },
  { id: 'chats',   label: 'Chat History', icon: '💬' },
]

const QUICK_ADD_URLS = [
  { label: 'Constitutional Law', url: 'https://www.law.cornell.edu/wex/constitutional_law', topic: 'Constitutional Law' },
  { label: 'Contracts',          url: 'https://www.law.cornell.edu/wex/contract',           topic: 'Contracts'          },
  { label: 'Torts',              url: 'https://www.law.cornell.edu/wex/tort',               topic: 'Torts'              },
  { label: 'Criminal Law',       url: 'https://www.law.cornell.edu/wex/criminal_law',       topic: 'Criminal Law'       },
  { label: 'Civil Procedure',    url: 'https://www.law.cornell.edu/wex/civil_procedure',    topic: 'Civil Procedure'    },
  { label: 'Evidence',           url: 'https://www.law.cornell.edu/wex/evidence',           topic: 'Evidence'           },
  { label: 'Real Property',      url: 'https://www.law.cornell.edu/wex/property',           topic: 'Real Property'      },
  { label: 'Family Law',         url: 'https://www.law.cornell.edu/wex/family_law',         topic: 'Family Law'         },
  { label: 'Negligence',         url: 'https://www.law.cornell.edu/wex/negligence',         topic: 'Torts'              },
  { label: 'Due Process',        url: 'https://www.law.cornell.edu/wex/due_process',        topic: 'Constitutional Law' },
  { label: 'Business Association',url:'https://www.law.cornell.edu/wex/business_association',topic:'Business Associations'},
  { label: 'Wills',              url: 'https://www.law.cornell.edu/wex/will',               topic: 'Wills & Trusts'     },
  { label: 'Trust',              url: 'https://www.law.cornell.edu/wex/trust',              topic: 'Wills & Trusts'     },
  { label: 'Hearsay',            url: 'https://www.law.cornell.edu/wex/hearsay',            topic: 'Evidence'           },
  { label: 'Consideration',      url: 'https://www.law.cornell.edu/wex/consideration',      topic: 'Contracts'          },
  { label: 'Mens Rea',           url: 'https://www.law.cornell.edu/wex/mens_rea',           topic: 'Criminal Law'       },
  { label: 'Jurisdiction',       url: 'https://www.law.cornell.edu/wex/jurisdiction',       topic: 'Civil Procedure'    },
  { label: 'Easement',           url: 'https://www.law.cornell.edu/wex/easement',           topic: 'Real Property'      },
  { label: 'Partnership',        url: 'https://www.law.cornell.edu/wex/partnership',        topic: 'Business Associations'},
  { label: 'Corporation',        url: 'https://www.law.cornell.edu/wex/corporation',        topic: 'Business Associations'},
  { label: 'Mens Rea',           url: 'https://www.law.cornell.edu/wex/mens_rea',           topic: 'Criminal Law'       },
  { label: 'Equal Protection',   url: 'https://www.law.cornell.edu/wex/equal_protection',   topic: 'Constitutional Law' },
  { label: 'Adverse Possession', url: 'https://www.law.cornell.edu/wex/adverse_possession', topic: 'Real Property'      },
  { label: 'Strict Liability',   url: 'https://www.law.cornell.edu/wex/strict_liability',   topic: 'Torts'              },
  { label: 'Defamation',         url: 'https://www.law.cornell.edu/wex/defamation',         topic: 'Torts'              },
]

const PROFILES_SQL = `-- 1. Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Policies
create policy "Allow public read" on public.profiles for select using (true);
create policy "Allow individual update" on public.profiles for update using (auth.uid() = id);

-- 4. Trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- 5. Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`

// ── Feedback banner ───────────────────────────────────────────────────────────
function Feedback({ result, error, onClearResult, onClearError }) {
  return (
    <>
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl
                        text-green-700 text-sm flex items-start
                        justify-between gap-3">
          <span>✅ {result}</span>
          <button onClick={onClearResult}
                  className="shrink-0 text-green-500 hover:text-green-700">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl
                        text-red-700 text-sm flex items-start
                        justify-between gap-3">
          <span>❌ {error}</span>
          <button onClick={onClearError}
                  className="shrink-0 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}
    </>
  )
}

// ── Scraper Tab ───────────────────────────────────────────────────────────────
function ScraperTab() {
  const [url,       setUrl]       = useState('')
  const [topic,     setTopic]     = useState('')
  const [scraping,  setScraping]  = useState(false)
  const [result,    setResult]    = useState('')
  const [error,     setError]     = useState('')
  const [scraped,   setScraped]   = useState([])
  const [loadingSc, setLoadingSc] = useState(false)

  const loadScraped = useCallback(async () => {
    setLoadingSc(true)
    try {
      const { data } = await supabase
        .from('scraped_data')
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(30)
      setScraped(data || [])
    } catch (err) {
      console.error('Load scraped error:', err)
    } finally {
      setLoadingSc(false)
    }
  }, [])

  useEffect(() => { loadScraped() }, [loadScraped])

  const handleScrape = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setScraping(true)
    setResult('')
    setError('')
    try {
      const res = await apiClient.triggerScrape(url.trim(), topic)
      setResult(res.data.message || 'Scraped successfully!')
      setUrl('')
      setTopic('')
      loadScraped()
    } catch (err) {
      setError(err.message || 'Failed to scrape URL')
    } finally {
      setScraping(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scraped item?')) return
    try {
      await supabase.from('scraped_data').delete().eq('id', id)
      setScraped(s => s.filter(i => i.id !== id))
    } catch (err) {
      setError('Failed to delete: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Web Scraper</h2>
        <p className="text-slate-500 text-sm mt-1">
          Scrape bar prep content and sync it to Supabase for the AI knowledge base.
        </p>
      </div>

      <Feedback
        result={result} error={error}
        onClearResult={() => setResult('')}
        onClearError={() => setError('')}
      />

      {/* Scrape form */}
      <form onSubmit={handleScrape} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            URL to Scrape
          </label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.law.cornell.edu/wex/negligence"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                       text-sm focus:outline-none focus:border-blue-500
                       transition-colors"
            disabled={scraping}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Topic (optional)
          </label>
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                       text-sm focus:outline-none focus:border-blue-500
                       transition-colors bg-white"
          >
            <option value="">-- Select topic --</option>
            {TOPICS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={scraping || !url.trim()}
          className="w-full py-3 bg-blue-600 text-white font-bold
                     rounded-xl hover:bg-blue-700 transition-colors
                     disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {scraping
            ? <><LoadingSpinner size="sm" color="white" /> Scraping…</>
            : '🕷️ Scrape & Sync to Supabase →'
          }
        </button>
      </form>

      {/* Quick add */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Quick Add — Cornell Law WEX (verified URLs):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {QUICK_ADD_URLS.map(({ label, url: u, topic: t }) => (
            <button
              key={label + u}
              onClick={() => { setUrl(u); setTopic(t) }}
              className="p-2 text-left text-xs bg-slate-50 border
                         border-slate-200 rounded-lg hover:bg-blue-50
                         hover:border-blue-300 text-slate-600
                         hover:text-blue-700 transition-colors"
            >
              📄 {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scraped data list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Scraped Data ({scraped.length})
          </h3>
          <button
            onClick={loadScraped}
            className="text-xs text-blue-600 hover:underline"
          >
            ↻ Refresh
          </button>
        </div>

        {loadingSc ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" text="Loading scraped data..." />
          </div>
        ) : scraped.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl
                          text-center py-8">
            <p className="text-slate-500 text-sm">
              No scraped data yet. Use the form above to scrape a URL.
            </p>
          </div>
        ) : (
          scraped.map(item => (
            <div key={item.id}
                 className="bg-white border border-slate-200 rounded-xl
                             p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {item.title || 'Untitled'}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate block"
                  >
                    {item.url}
                  </a>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {item.topic && (
                      <span className="text-[10px] bg-blue-100 text-blue-700
                                       px-2 py-0.5 rounded-full font-medium">
                        {item.topic}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {(item.word_count || 0).toLocaleString()} words
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.scraped_at
                        ? new Date(item.scraped_at).toLocaleDateString()
                        : 'Just now'
                      }
                    </span>
                    {item.is_indexed && (
                      <span className="text-[10px] bg-green-100 text-green-700
                                       px-2 py-0.5 rounded-full font-medium">
                        ✓ Indexed
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-400 hover:text-red-600 text-xs
                             shrink-0 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
              {item.content && (
                <p className="text-xs text-slate-500 line-clamp-2
                               bg-slate-50 rounded-lg p-2">
                  {item.content.substring(0, 200)}…
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Blog Tab ──────────────────────────────────────────────────────────────────
function BlogTab() {
  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result,     setResult]     = useState('')
  const [error,      setError]      = useState('')
  const [topic,      setTopic]      = useState(TOPICS[0])
  const [filter,     setFilter]     = useState('all')

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (err) throw err

      const filtered = filter === 'all'
        ? (data || [])
        : (data || []).filter(p => p.status === filter)

      setPosts(filtered)
    } catch (err) {
      console.error('Load blog posts error:', err)
      setError(err.message || 'Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadPosts() }, [loadPosts])

  const handleGenerate = async () => {
    setGenerating(true)
    setResult('')
    setError('')
    try {
      const res = await apiClient.generateBlogPost({ topic })
      setResult(res.data.message || 'Blog post generated!')
      setTimeout(() => loadPosts(), 1000)
    } catch (err) {
      setError(err.message || 'Failed to generate blog post')
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      const { error: err } = await supabase
        .from('blog_posts')
        .update({
          status:       'published',
          published_at: new Date().toISOString(),
          updated_at:   new Date().toISOString(),
        })
        .eq('id', id)
      if (err) throw err
      setPosts(p => p.map(post =>
        post.id === id
          ? { ...post, status: 'published', published_at: new Date().toISOString() }
          : post
      ))
      setResult('Post published! ✅')
    } catch (err) {
      setError('Failed to publish: ' + err.message)
    }
  }

  const handleUnpublish = async (id) => {
    try {
      const { error: err } = await supabase
        .from('blog_posts')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (err) throw err
      setPosts(p => p.map(post =>
        post.id === id ? { ...post, status: 'pending' } : post
      ))
      setResult('Post unpublished.')
    } catch (err) {
      setError('Failed to unpublish: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post? This cannot be undone.')) return
    try {
      const { error: err } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)
      if (err) throw err
      setPosts(p => p.filter(post => post.id !== id))
      setResult('Post deleted.')
    } catch (err) {
      setError('Failed to delete: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Blog Management</h2>
        <p className="text-slate-500 text-sm mt-1">
          Generate AI blog posts using Groq AI for text and Pollinations AI for
          cover images. Review and publish from here.
        </p>
      </div>

      <Feedback
        result={result} error={error}
        onClearResult={() => setResult('')}
        onClearError={() => setError('')}
      />

      {/* Generate */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Generate New Post</h3>
        <div className="flex gap-3">
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2
                       text-sm focus:outline-none focus:border-blue-500
                       transition-colors bg-white"
          >
            {TOPICS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl
                       hover:bg-blue-700 transition-colors disabled:opacity-60
                       flex items-center gap-2 whitespace-nowrap"
          >
            {generating
              ? <><LoadingSpinner size="sm" color="white" /> Generating…</>
              : '✨ Generate Post'
            }
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Groq AI writes the article • Pollinations AI generates the cover image •
          Post saved as draft for your review
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'published'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium
              capitalize transition-colors
              ${filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={loadPosts}
          className="ml-auto px-3 py-1.5 text-xs text-slate-500
                     hover:text-slate-700 border border-slate-200
                     rounded-full hover:bg-slate-50 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner size="md" text="Loading posts..." />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl
                        text-center py-12 space-y-2">
          <p className="text-4xl">📰</p>
          <p className="text-slate-500 text-sm">
            {filter === 'all'
              ? 'No blog posts yet. Generate one above.'
              : `No ${filter} posts.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id}
                 className="bg-white border border-slate-200 rounded-xl
                             overflow-hidden">
              {/* Cover image */}
              {post.image_url && (
                <div className="w-full h-32 bg-slate-100 overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={e => e.currentTarget.style.display = 'none'}
                  />
                </div>
              )}

              <div className="p-4 space-y-3">
                {/* Status + topic */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${post.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}>
                    {post.status}
                  </span>
                  {post.topic && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100
                                     text-blue-700 rounded-full">
                      {post.topic}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">
                    {(post.word_count || 0).toLocaleString()} words
                    {post.read_time ? ` • ${post.read_time} min read` : ''}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {post.title}
                </h3>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}

                {/* Dates */}
                <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                  <span>
                    Created: {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  {post.published_at && (
                    <span>
                      Published: {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  )}
                  {post.views > 0 && (
                    <span>{post.views.toLocaleString()} views</span>
                  )}
                  <span className="text-[10px] text-slate-300">
                    AI: {post.ai_model || 'groq+pollinations'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 flex-wrap">
                  {post.status !== 'published' ? (
                    <button
                      onClick={() => handleApprove(post.id)}
                      className="flex-1 py-1.5 text-xs font-bold bg-green-600
                                 text-white rounded-lg hover:bg-green-700
                                 transition-colors"
                    >
                      ✅ Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(post.id)}
                      className="flex-1 py-1.5 text-xs font-medium bg-slate-100
                                 text-slate-600 rounded-lg hover:bg-slate-200
                                 transition-colors"
                    >
                      Unpublish
                    </button>
                  )}
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 text-xs font-medium text-center
                               border border-slate-200 text-slate-600 rounded-lg
                               hover:bg-slate-50 transition-colors"
                  >
                    Preview ↗
                  </a>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 py-1.5 text-xs text-red-600
                               hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [usersList,    setUsersList]    = useState([])
  const [attemptsList, setAttemptsList] = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [page,         setPage]         = useState(0)
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profilesRes, attemptsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('attempts')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
      ])
      if (profilesRes.error) throw profilesRes.error
      setUsersList(profilesRes.data  || [])
      setAttemptsList(attemptsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  const combinedUsers = [...usersList]
  const userIds = new Set(usersList.map(u => u.id))
  attemptsList.forEach(att => {
    if (att.user_id && !userIds.has(att.user_id)) {
      combinedUsers.push({
        id:          att.user_id,
        email:       `Pre-sync (${att.user_id.slice(0, 8)}…)`,
        created_at:  att.created_at,
        isSynthetic: true,
      })
      userIds.add(att.user_id)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Users & Activity</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitor student registrations and exam attempts.
          </p>
        </div>
        <button onClick={load}
                className="px-4 py-2 text-sm border border-slate-200
                           rounded-xl hover:bg-slate-50 transition-colors">
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Synced Users',   value: usersList.length                              },
          { label: 'Attempts',       value: attemptsList.length                           },
          { label: 'Correct',        value: attemptsList.filter(a => a.is_correct).length },
          {
            label: 'Accuracy',
            value: attemptsList.length
              ? `${Math.round(
                  (attemptsList.filter(a => a.is_correct).length /
                    attemptsList.length) * 100
                )}%`
              : '—',
          },
        ].map(({ label, value }) => (
          <div key={label}
               className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl
                        py-12 flex justify-center">
          <LoadingSpinner size="lg" text="Loading users..." />
        </div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-semibold text-amber-900">Profiles table setup needed</h4>
              <p className="text-amber-800 text-sm mt-1">
                Run this SQL in your Supabase SQL Editor:
              </p>
            </div>
          </div>
          <pre className="bg-slate-900 rounded-lg p-4 text-xs font-mono
                          text-slate-300 overflow-x-auto max-h-[300px]
                          select-all whitespace-pre-wrap">
            {PROFILES_SQL}
          </pre>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-medium">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">UUID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {combinedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No users yet. When users sign up they will appear here.
                  </td>
                </tr>
              ) : (
                combinedUsers.map(usr => (
                  <tr key={usr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {usr.email || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 select-all">
                      {usr.id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded
                        text-xs font-medium
                        ${usr.isSynthetic
                          ? 'bg-amber-50 text-amber-800 border border-amber-100'
                          : 'bg-green-50 text-green-800 border border-green-100'
                        }`}>
                        {usr.isSynthetic ? 'Attempt Only' : 'Synced'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {usr.created_at
                        ? new Date(usr.created_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3
                          border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page + 1}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg
                           disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={attemptsList.length < PAGE_SIZE}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg
                           disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent attempts */}
      {attemptsList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Recent Attempts ({attemptsList.length})
          </h3>
          {attemptsList.slice(0, 10).map(attempt => (
            <div key={attempt.id}
                 className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold px-2 py-0.5
                                 bg-blue-50 text-blue-700 rounded-full">
                  {attempt.topic}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold
                    ${attempt.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                    {attempt.is_correct ? '✅ Correct' : '❌ Incorrect'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(attempt.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg
                             p-2 line-clamp-2 text-xs">
                {attempt.question}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Admin component ──────────────────────────────────────────────────────
export default function Admin() {
  const navigate   = useNavigate()
  const [activeTab, setActiveTab] = useState('videos')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState('')
  const [error,     setError]     = useState('')

  // Video form
  const [videoUrl,   setVideoUrl]   = useState('')
  const [videoTopic, setVideoTopic] = useState(TOPICS[0])
  const [videoOrder, setVideoOrder] = useState(0)

  // Web page form
  const [pageUrl, setPageUrl] = useState('')

  // PDF form
  const [pdfFile,   setPdfFile]   = useState(null)
  const [uploading, setUploading] = useState(false)

  // Modules
  const [modules,        setModules]        = useState([])
  const [loadingModules, setLoadingModules] = useState(false)

  // Chat history
  const [chatSessions,    setChatSessions]    = useState([])
  const [loadingChats,    setLoadingChats]    = useState(false)
  const [chatsError,      setChatsError]      = useState(null)
  const [expandedSession, setExpandedSession] = useState(null)

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { navigate('/admin/login'); return }
    apiClient.adminVerify(token)
      .then(res => {
        if (!res.data.valid) {
          localStorage.removeItem('admin_token')
          navigate('/admin/login')
        }
      })
      .catch(() => navigate('/admin/login'))
  }, [navigate])

  // ── Tab data loaders ───────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'modules') loadModules()
    if (activeTab === 'chats')   loadChatSessions()
  }, [activeTab])

  const loadModules = async () => {
    setLoadingModules(true)
    try {
      const res = await apiClient.getModules('', true)
      setModules(res.data.modules || [])
    } catch (err) {
      console.error('Load modules error:', err)
    } finally {
      setLoadingModules(false)
    }
  }

  const loadChatSessions = async () => {
    setLoadingChats(true)
    setChatsError(null)
    try {
      const token = localStorage.getItem('admin_token')
      const res   = await apiClient.adminGetAllSessions(token)
      setChatSessions(res.data.sessions || [])
    } catch (err) {
      setChatsError(err.message)
    } finally {
      setLoadingChats(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  const clear = () => { setResult(''); setError('') }

  // ── Video submit ───────────────────────────────────────────────────────────
  const handleVideoSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    clear()
    try {
      const res = await apiClient.processVideo(videoUrl, videoTopic, videoOrder)
      let msg   = res.data.message || 'Module created!'
      if (res.data.source_type === 'description') {
        msg += ' (Used description — transcript blocked by YouTube)'
      } else if (res.data.source_type === 'transcript') {
        msg += ' Full transcript extracted!'
      }
      setResult(msg)
      setVideoUrl('')
      setVideoOrder(p => p + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Web page submit ────────────────────────────────────────────────────────
  const handlePageSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    clear()
    try {
      const res = await apiClient.ingestUrl(pageUrl)
      setResult(res.data.message || 'Page ingested!')
      setPageUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── PDF upload ─────────────────────────────────────────────────────────────
  const handlePdfUpload = async (e) => {
    e.preventDefault()
    if (!pdfFile) return
    setUploading(true)
    clear()
    try {
      const filename    = pdfFile.name
      const storagePath = `pdfs/${Date.now()}_${filename}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, pdfFile)
      if (uploadError) throw new Error(uploadError.message)

      const { data: docData, error: docError } = await supabase
        .from('user_documents')
        .insert({
          filename,
          file_type:    pdfFile.type,
          file_size:    pdfFile.size,
          storage_path: storagePath,
          is_indexed:   false,
        })
        .select()
        .single()
      if (docError) throw new Error(docError.message)

      const res = await apiClient.processPdf(storagePath, filename, docData.id)
      setResult(res.data.message || 'PDF uploaded and indexed!')
      setPdfFile(null)
      e.target.reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  // ── Delete module ──────────────────────────────────────────────────────────
  const handleDeleteModule = async (id) => {
    if (!window.confirm('Delete this module?')) return
    await supabase.from('course_modules').delete().eq('id', id)
    setModules(m => m.filter(mod => mod.id !== id))
  }

  // ── Toggle module publish ──────────────────────────────────────────────────
  const handleTogglePublish = async (id, current) => {
    await supabase
      .from('course_modules')
      .update({ is_published: !current })
      .eq('id', id)
    setModules(m =>
      m.map(mod => mod.id === id ? { ...mod, is_published: !current } : mod)
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage BarPrep AI content, blog, and users
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium border border-slate-200
                     text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Logout →
        </button>
      </div>

      {/* ── Tabs — desktop ── */}
      <div className="hidden sm:flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); clear() }}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap
              transition-colors flex-1 flex items-center justify-center gap-1.5
              ${activeTab === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tabs — mobile dropdown ── */}
      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={e => { setActiveTab(e.target.value); clear() }}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                     text-sm font-medium text-slate-700 focus:outline-none
                     focus:border-blue-500 bg-white"
        >
          {TABS.map(({ id, label, icon }) => (
            <option key={id} value={id}>{icon} {label}</option>
          ))}
        </select>
      </div>

      {/* ── Global feedback (for video/web/pdf tabs) ── */}
      {['videos', 'web', 'pdf'].includes(activeTab) && (
        <Feedback
          result={result} error={error}
          onClearResult={() => setResult('')}
          onClearError={() => setError('')}
        />
      )}

      {/* ══════════════════════════════════════════
          VIDEOS TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'videos' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add YouTube Lecture</h2>
            <p className="text-slate-500 text-sm mt-1">
              AI extracts transcript → summary → outline → indexes for chat.
            </p>
          </div>

          <form onSubmit={handleVideoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                YouTube URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                           text-sm focus:outline-none focus:border-blue-500
                           transition-colors"
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Topic
                </label>
                <select
                  value={videoTopic}
                  onChange={e => setVideoTopic(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                             text-sm focus:outline-none focus:border-blue-500
                             transition-colors bg-white"
                  disabled={loading}
                >
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Order Index
                </label>
                <input
                  type="number"
                  value={videoOrder}
                  onChange={e => setVideoOrder(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                             text-sm focus:outline-none focus:border-blue-500
                             transition-colors"
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !videoUrl.trim()}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl
                         hover:bg-blue-700 transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading
                ? <><LoadingSpinner size="sm" color="white" /> Processing… (up to 60s)</>
                : 'Create Course Module →'
              }
            </button>
          </form>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              ⚙️ What happens automatically:
            </p>
            <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
              <li>Gets title + thumbnail from YouTube</li>
              <li>Extracts transcript (description as fallback)</li>
              <li>Groq AI generates summary + outline</li>
              <li>Indexes content for AI chat search</li>
              <li>Module appears on Tutorials page immediately</li>
            </ol>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          WEB PAGES TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'web' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Scrape Web Page</h2>
            <p className="text-slate-500 text-sm mt-1">
              Add bar prep websites to the AI knowledge base via ingest-url.
            </p>
          </div>

          <form onSubmit={handlePageSubmit} className="space-y-4">
            <input
              type="url"
              value={pageUrl}
              onChange={e => setPageUrl(e.target.value)}
              placeholder="https://www.law.cornell.edu/wex/tort"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                         text-sm focus:outline-none focus:border-blue-500
                         transition-colors"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !pageUrl.trim()}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl
                         hover:bg-blue-700 transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading
                ? <><LoadingSpinner size="sm" color="white" /> Scraping…</>
                : 'Add Web Page →'
              }
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_ADD_URLS.slice(0, 12).map(({ label, url }) => (
              <button
                key={label + url}
                onClick={() => setPageUrl(url)}
                className="p-2 text-left text-xs bg-slate-50 border border-slate-200
                           rounded-lg hover:bg-blue-50 hover:border-blue-300
                           text-slate-600 hover:text-blue-700 transition-colors"
              >
                📄 {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PDF TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'pdf' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upload Study Document</h2>
            <p className="text-slate-500 text-sm mt-1">
              Upload PDFs, notes, or guides. AI reads and indexes them.
            </p>
          </div>

          <form onSubmit={handlePdfUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl
                            p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={e => setPdfFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-500
                           file:mr-4 file:py-2 file:px-4 file:rounded-lg
                           file:border-0 file:text-sm file:font-medium
                           file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100"
                disabled={uploading}
              />
              {pdfFile ? (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  ✅ {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              ) : (
                <p className="text-slate-400 text-sm mt-2">
                  PDF, TXT, DOC — up to 10MB
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || !pdfFile}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl
                         hover:bg-blue-700 transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2 min-h-[48px]"
            >
              {uploading
                ? <><LoadingSpinner size="sm" color="white" /> Uploading & Indexing…</>
                : 'Upload & Index Document →'
              }
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODULES TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Course Modules ({modules.length})
            </h2>
            <button
              onClick={loadModules}
              className="px-4 py-2 text-sm border border-slate-200
                         rounded-xl hover:bg-slate-50 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {loadingModules ? (
            <div className="bg-white border border-slate-200 rounded-xl
                            py-12 flex justify-center">
              <LoadingSpinner size="lg" text="Loading modules..." />
            </div>
          ) : modules.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl
                            text-center py-12">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-slate-500 text-sm">
                No modules yet. Add YouTube videos in the Videos tab.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map(module => (
                <div key={module.id}
                     className="bg-white border border-slate-200 rounded-xl
                                flex items-start gap-4 p-4">
                  {module.thumbnail_url && (
                    <img
                      src={module.thumbnail_url}
                      alt={module.title}
                      className="w-24 h-16 object-cover rounded-lg
                                 shrink-0 bg-slate-200"
                      onError={e => e.currentTarget.style.display = 'none'}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-100
                                       text-blue-700 rounded-full">
                        {module.topic}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${module.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                        {module.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 text-sm truncate">
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {module.ai_summary}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePublish(module.id, module.is_published)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg
                        transition-colors
                        ${module.is_published
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                      {module.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    {module.video_url && (
                      <a
                        href={module.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs text-center
                                   text-blue-600 hover:underline"
                      >
                        Watch ↗
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      className="px-3 py-1 text-xs text-red-600
                                 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          SCRAPER TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'scraper' && <ScraperTab />}

      {/* ══════════════════════════════════════════
          BLOG TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'blog' && <BlogTab />}

      {/* ══════════════════════════════════════════
          USERS TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'users' && <UsersTab />}

      {/* ══════════════════════════════════════════
          CHAT HISTORY TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'chats' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Student Chat History
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Read-only view of all student AI Coach conversations.
              </p>
            </div>
            <button
              onClick={loadChatSessions}
              className="px-4 py-2 text-sm border border-slate-200
                         rounded-xl hover:bg-slate-50 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {loadingChats ? (
            <div className="bg-white border border-slate-200 rounded-xl
                            py-8 flex justify-center">
              <LoadingSpinner size="md" text="Loading sessions..." />
            </div>
          ) : chatsError ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl
                            p-6 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <h4 className="font-semibold text-amber-900">Backend support needed</h4>
                  <p className="text-amber-800 text-sm mt-1">{chatsError}</p>
                  <p className="text-amber-700 text-xs mt-2">
                    The chat-sessions Edge Function needs an admin_list action that
                    verifies the admin token and returns all sessions using the
                    service-role key.
                  </p>
                </div>
              </div>
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl
                            text-center py-12">
              <p className="text-slate-500 text-sm">No chat sessions saved yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatSessions.map(session => {
                const isOpen = expandedSession === session.id
                return (
                  <div key={session.id}
                       className="bg-white border border-slate-200 rounded-xl
                                  overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedSession(isOpen ? null : session.id)
                      }
                      className="w-full flex items-center justify-between gap-3
                                 px-5 py-4 text-left hover:bg-slate-50
                                 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {session.title || 'Untitled Chat'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {session.user_email ||
                            `User: ${session.user_id?.slice(0, 8)}…`}
                          {' · '}
                          {session.updated_at
                            ? new Date(session.updated_at).toLocaleString()
                            : 'N/A'}
                          {' · '}
                          {(session.messages || []).length} messages
                        </p>
                      </div>
                      <span className="text-slate-400 text-sm shrink-0">
                        {isOpen ? 'Hide ▲' : 'View ▼'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 px-5 py-4
                                      space-y-3 bg-slate-50 max-h-96
                                      overflow-y-auto">
                        {(session.messages || []).map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${
                              msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div className={`max-w-[85%] rounded-xl px-3 py-2
                              text-sm
                              ${msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-800'
                              }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
