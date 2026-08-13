import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, Link }         from 'react-router-dom'
import { apiClient, supabase }     from '../api/client'
import LoadingSpinner              from '../components/LoadingSpinner'
import ReactMarkdown               from 'react-markdown'
import { useProgress }             from '../context/ProgressContext'

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractYouTubeId(url) {
  if (!url) return null
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

function buildGreeting(moduleData, progress) {
  const { stats, weakTopics } = progress
  const isWeak = weakTopics.includes(moduleData.topic)

  let msg = `Hello! I've studied this lecture on **${moduleData.topic}** — "${moduleData.title}".\n\n`

  if (stats.totalAttempts > 0) {
    msg += `📊 Your overall accuracy is **${stats.overallAccuracy}%**. `
    if (isWeak) {
      msg += `**${moduleData.topic}** is one of your focus areas — let's make the most of this lecture!\n\n`
    } else {
      msg += `\n\n`
    }
  }

  msg += `I can help you understand the concepts, answer questions about the material, or quiz you on key points. What would you like to know?`
  return msg
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-slate-100 rounded-xl rounded-bl-sm px-3 py-2">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button
      onClick={handle}
      className="text-[10px] text-slate-400 hover:text-slate-600
                 transition-colors flex items-center gap-1 mt-1"
    >
      {copied ? '✅ Copied' : '📋 Copy'}
    </button>
  )
}

// ── YouTube embed ─────────────────────────────────────────────────────────────
function VideoPlayer({ url, title }) {
  const youtubeId = extractYouTubeId(url)

  if (!youtubeId) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-300
                      bg-slate-50 aspect-video flex items-center
                      justify-center text-slate-400 text-sm">
        No video available for this tutorial
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-md bg-black aspect-video">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write;
               encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ModuleDetail() {
  const { id }   = useParams()
  const progress = useProgress().progress
  const { markModuleWatched, getProgressSummary } = useProgress()

  const [module,       setModule]       = useState(null)
  const [nextModule,   setNextModule]   = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [errorType,    setErrorType]    = useState(null) // 'not_found' | 'network'
  const [errorMsg,     setErrorMsg]     = useState('')
  const [question,     setQuestion]     = useState('')
  const [chatHistory,  setChatHistory]  = useState([])
  const [chatLoading,  setChatLoading]  = useState(false)

  const chatBottomRef = useRef(null)
  const inputRef      = useRef(null)

  // ── Restore chat from sessionStorage ─────────────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(`module_chat_${id}`)
    if (saved) {
      try { setChatHistory(JSON.parse(saved)) } catch {}
    }
  }, [id])

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatLoading])

  // ── Load module ───────────────────────────────────────────────────────────
  const loadModule = useCallback(async () => {
    if (progress.loading) return // wait for progress to be ready

    setLoading(true)
    setErrorType(null)
    setErrorMsg('')

    try {
      const { data, error: dbError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (dbError) {
        setErrorType('network')
        throw new Error(dbError.message)
      }
      if (!data) {
        setErrorType('not_found')
        throw new Error('Module not found')
      }

      setModule(data)
      await markModuleWatched(data.id, data.title, data.topic)

      // Build greeting only if no saved chat
      const saved = sessionStorage.getItem(`module_chat_${id}`)
      if (!saved) {
        const greeting = buildGreeting(data, progress)
        const initial  = [{ role: 'assistant', content: greeting, isGreeting: true }]
        setChatHistory(initial)
        sessionStorage.setItem(`module_chat_${id}`, JSON.stringify(initial))
      }

      // Load next module in same topic
      const { data: siblings } = await supabase
        .from('course_modules')
        .select('id, title, topic, order_index')
        .eq('topic', data.topic)
        .eq('is_published', true)
        .order('order_index', { ascending: true })

      if (siblings?.length > 1) {
        const currentIdx = siblings.findIndex(m => m.id === data.id)
        if (currentIdx !== -1 && currentIdx < siblings.length - 1) {
          setNextModule(siblings[currentIdx + 1])
        }
      }

    } catch (err) {
      console.error('Error loading module:', err)
      setErrorMsg(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [id, progress.loading, markModuleWatched])

  useEffect(() => {
    loadModule()
  }, [loadModule])

  // ── Ask question ──────────────────────────────────────────────────────────
  const askQuestion = useCallback(async (e) => {
    e?.preventDefault()
    const text = question.trim()
    if (!text || chatLoading || !module) return

    setQuestion('')
    setChatLoading(true)

    const withUser = [...chatHistory, { role: 'user', content: text }]
    setChatHistory(withUser)

    try {
      const contextMsg = [
        '[MODULE CONTEXT]',
        `Lecture: "${module.title}" | Topic: ${module.topic}`,
        module.ai_summary ? `Summary: ${module.ai_summary}` : '',
        '',
        '[STUDENT PROGRESS]',
        getProgressSummary(),
        '',
        '[STUDENT QUESTION]',
        text,
      ].join('\n').trim()

      // Filter greeting from history sent to API
      const history = withUser
        .filter(m => !m.isGreeting)
        .slice(-8)
        .map(({ role, content }) => ({ role, content }))

      const res = await apiClient.chat(contextMsg, history)

      const final = [
        ...withUser,
        { role: 'assistant', content: res.data.reply || '' },
      ]
      setChatHistory(final)
      sessionStorage.setItem(`module_chat_${id}`, JSON.stringify(final))
    } catch (err) {
      const errMsg = [
        ...withUser,
        {
          role:    'assistant',
          content: `I encountered an error: ${err.message}. Please try again.`,
        },
      ]
      setChatHistory(errMsg)
    } finally {
      setChatLoading(false)
      inputRef.current?.focus()
    }
  }, [question, chatLoading, module, chatHistory, getProgressSummary, id])

  // ── Derived values ────────────────────────────────────────────────────────
  const isWeakTopic   = module ? progress.weakTopics.includes(module.topic)   : false
  const isStrongTopic = module ? progress.strongTopics.includes(module.topic) : false
  const topicPerf     = module ? progress.stats.topicPerformance?.[module.topic] : null

  const smartQuickQuestions = useMemo(() => {
    if (!module) return []
    return [
      isWeakTopic
        ? `I struggle with ${module.topic} — explain simply`
        : `Summarize this lecture`,
      'Quiz me on this topic',
      'What are the key rules to know?',
      isWeakTopic
        ? `Common mistakes in ${module.topic}?`
        : 'What will the bar exam test here?',
    ]
  }, [module, isWeakTopic])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading tutorial..." />
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (errorType || !module) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="text-4xl">
          {errorType === 'not_found' ? '🔍' : '⚠️'}
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {errorType === 'not_found'
            ? 'Tutorial Not Found'
            : 'Failed to Load Tutorial'
          }
        </h2>
        <p className="text-sm text-slate-500">
          {errorType === 'not_found'
            ? "This tutorial doesn't exist or has been removed."
            : `Error: ${errorMsg}`
          }
        </p>
        <Link
          to="/tutorials"
          className="inline-block px-6 py-2.5 border border-slate-200
                     text-slate-700 rounded-xl hover:bg-slate-50
                     transition-colors text-sm font-medium"
        >
          ← Back to Tutorials
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-0">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <span>→</span>
        <Link to="/tutorials" className="hover:text-blue-600 transition-colors">
          Tutorials
        </Link>
        <span>→</span>
        <span className="text-slate-700 truncate max-w-[200px]">
          {module.title}
        </span>
      </div>

      {/* ── Module Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start
                      sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 bg-blue-100
                             text-blue-700 rounded-full">
              {module.topic}
            </span>
            {isWeakTopic && (
              <span className="text-xs font-bold px-2 py-0.5 bg-amber-100
                               text-amber-700 rounded-full">
                ⚠️ Focus Area
              </span>
            )}
            {isStrongTopic && (
              <span className="text-xs font-bold px-2 py-0.5 bg-green-100
                               text-green-700 rounded-full">
                ✅ Strong Area
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {module.title}
          </h1>
        </div>

        {/* Topic performance */}
        {topicPerf && topicPerf.attempts > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl
                          p-3 text-center shrink-0 min-w-[120px]">
            <div className={`text-2xl font-extrabold
              ${topicPerf.accuracy >= 75 ? 'text-green-600'
                : topicPerf.accuracy >= 50 ? 'text-blue-600'
                : 'text-amber-600'
              }`}>
              {topicPerf.accuracy}%
            </div>
            <div className="text-[10px] text-slate-400 uppercase">
              Your Accuracy
            </div>
            <div className="text-xs text-slate-500">
              {topicPerf.attempts} attempts
            </div>
          </div>
        )}
      </div>

      {/* ── Weak topic alert ── */}
      {isWeakTopic && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl
                        p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              This is one of your focus areas
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {topicPerf?.attempts > 0
                ? `You're at ${topicPerf.accuracy}% accuracy on ${module.topic}. Watch carefully and use the AI coach.`
                : `You haven't practiced ${module.topic} yet. After watching, test yourself!`
              }
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Link
                to="/mock-exam"
                className="text-xs bg-amber-600 text-white px-3 py-1
                           rounded-full hover:bg-amber-700 transition-colors"
              >
                Practice Questions →
              </Link>
              <Link
                to="/blog"
                className="text-xs bg-amber-100 text-amber-800 px-3 py-1
                           rounded-full hover:bg-amber-200 transition-colors
                           border border-amber-200"
              >
                📰 Read Blog Tips →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Video */}
          <VideoPlayer url={module.video_url} title={module.title} />

          {/* AI Summary */}
          {module.ai_summary && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">
                📋 What You Will Learn
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {module.ai_summary}
              </p>
            </div>
          )}

          {/* Course Outline */}
          {module.ai_outline && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">
                📚 Course Outline
              </h2>
              <div className="prose prose-sm prose-slate max-w-none">
                <ReactMarkdown>{module.ai_outline}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Next module */}
          {nextModule && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4
                            flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">
                  Up Next
                </p>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {nextModule.title}
                </p>
              </div>
              <Link
                to={`/tutorials/${nextModule.id}`}
                className="shrink-0 px-4 py-2 bg-blue-600 text-white
                           text-xs font-bold rounded-xl hover:bg-blue-700
                           transition-colors"
              >
                Next →
              </Link>
            </div>
          )}

          {/* What to do next */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl
                          p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-700">
              ⚡ What to Do Next
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  to:      '/mock-exam',
                  icon:    '📝',
                  title:   'Practice Questions',
                  desc:    `Test your ${module.topic} knowledge`,
                },
                {
                  to:      '/chat',
                  icon:    '🤖',
                  title:   'Ask AI Coach',
                  desc:    'Deep dive into concepts',
                },
                {
                  to:      '/blog',
                  icon:    '📰',
                  title:   'Bar Prep Blog',
                  desc:    `Tips on ${module.topic}`,
                },
              ].map(({ to, icon, title, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 p-3 bg-white
                             rounded-xl border border-slate-200
                             hover:border-blue-300 hover:bg-blue-50
                             transition-all"
                >
                  <span className="text-lg">{icon}</span>
                  <div>
                    <div className="font-semibold text-xs text-slate-800">
                      {title}
                    </div>
                    <div className="text-[10px] text-slate-500">{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column: Chat ── */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl
                          flex flex-col h-[500px] lg:h-[600px]
                          sticky top-20 overflow-hidden">

            {/* Chat header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm">
                🤖 AI Lecture Coach
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isWeakTopic
                  ? `⚠️ Focus area — I'll explain carefully`
                  : 'Ask questions about this lecture'
                }
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`
                    max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }
                  `}>
                    {msg.role === 'assistant' ? (
                      <>
                        <div className="prose prose-xs prose-slate max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        <CopyButton text={msg.content} />
                      </>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && <TypingIndicator />}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick questions */}
            <div className="px-3 py-2 border-t border-slate-100
                            flex gap-2 overflow-x-auto shrink-0">
              {smartQuickQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => {
                    setQuestion(q)
                    inputRef.current?.focus()
                  }}
                  className="text-xs bg-slate-50 border border-slate-200
                             rounded-full px-3 py-1 whitespace-nowrap
                             hover:bg-blue-50 hover:border-blue-300
                             text-slate-600 hover:text-blue-700
                             transition-colors shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={askQuestion}
              className="p-3 border-t border-slate-100 flex gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder={
                  isWeakTopic
                    ? `What confuses you about ${module.topic}?`
                    : 'Ask about this lecture...'
                }
                className="flex-1 border border-slate-200 rounded-xl
                           px-3 py-2 text-xs focus:outline-none
                           focus:border-blue-500 transition-colors"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !question.trim()}
                className="px-3 py-2 bg-blue-600 text-white text-xs
                           font-bold rounded-xl hover:bg-blue-700
                           transition-colors disabled:opacity-60 shrink-0"
              >
                {chatLoading ? '…' : 'Ask'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
