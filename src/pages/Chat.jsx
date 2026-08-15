import { useState, useRef, useEffect, useCallback } from 'react'
import { Link }                from 'react-router-dom'
import { apiClient }           from '../api/client'
import LoadingSpinner          from '../components/LoadingSpinner'
import ReactMarkdown           from 'react-markdown'
import { useProgress }         from '../context/ProgressContext'
import { useSubscription }     from '../context/SubscriptionContext'
import { UpgradeModal }        from '../components/UpgradePrompt'
import DailyLimitBar           from '../components/DailyLimitBar'

const MAX_INPUT_CHARS = 2000
const MAX_HISTORY     = 10
const SESSION_LIMIT   = 30

const GREETING = {
  role:       'assistant',
  content:    "Hello! I'm your BarPrep AI Coach. I can help you understand legal concepts, answer practice questions, and explain bar exam topics step-by-step. What would you like to study today?",
  sources:    [],
  timestamp:  new Date().toISOString(),
  isGreeting: true,
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-slate-100 rounded-xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

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
                 transition-colors flex items-center gap-1"
    >
      {copied ? '✅ Copied' : '📋 Copy'}
    </button>
  )
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const diff  = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60000)
  const hrs   = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs  < 24) return `${hrs}h ago`
  if (days < 7)  return `${days}d ago`
  return date.toLocaleDateString()
}

function hostFromUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url }
}

export default function Chat() {
  const { progress, getProgressSummary } = useProgress()
  const {
    isFree,
    checkLimit,
    incrementUsage,
  } = useSubscription()

  const [messages,        setMessages]        = useState([GREETING])
  const [input,           setInput]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [sessions,        setSessions]        = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sidebarOpen,     setSidebarOpen]     = useState(false)
  const [progressInjected,setProgressInjected]= useState(false)
  const [sessionPage,     setSessionPage]     = useState(0)
  const [showUpgrade,     setShowUpgrade]     = useState(false)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const saveTimer  = useRef(null)

  useEffect(() => { loadSessions() }, [])

  // ── Personalized greeting ──────────────────────────────────────────────────
  useEffect(() => {
    if (progressInjected || progress.loading) return
    if (
      progress.stats.totalAttempts === 0 &&
      progress.watchedModules.length === 0
    ) return

    const { stats, weakTopics, strongTopics, recommendedTopics } = progress
    let msg = `Hello! I'm your BarPrep AI Coach and I've reviewed your study progress.\n\n`

    if (stats.totalAttempts > 0) {
      msg += `📊 **Your Stats:** ${stats.totalAttempts} questions answered with **${stats.overallAccuracy}% accuracy**`
      if (stats.currentStreak > 0) {
        msg += ` • 🔥 ${stats.currentStreak}-day streak!`
      }
      msg += `\n\n`
    }
    if (strongTopics.length > 0) {
      msg += `✅ **Strong:** ${strongTopics.slice(0, 3).join(', ')}\n\n`
    }
    if (weakTopics.length > 0) {
      msg += `⚠️ **Needs Work:** ${weakTopics.slice(0, 3).join(', ')}\n\n`
    }
    if (recommendedTopics.length > 0) {
      msg += `🎯 **Recommended Focus:** ${recommendedTopics.join(', ')}\n\nWhat would you like to work on?`
    } else {
      msg += `What would you like to study today?`
    }

    setMessages([{
      role:       'assistant',
      content:    msg,
      sources:    [],
      timestamp:  new Date().toISOString(),
      isGreeting: true,
    }])
    setProgressInjected(true)
  }, [
    progress.loading,
    progress.stats.totalAttempts,
    progressInjected,
  ])

  useEffect(() => {
    chatBottomRef?.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const chatBottomRef = useRef(null)

  const loadSessions = async () => {
    setSessionsLoading(true)
    try {
      const res = await apiClient.getSessions()
      setSessions(res.data.sessions || [])
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  const startNewChat = useCallback(() => {
    setMessages([GREETING])
    setActiveSessionId(null)
    setInput('')
    setSidebarOpen(false)
    setProgressInjected(false)
    inputRef.current?.focus()
  }, [])

  const loadSession = async (sessionId) => {
    try {
      const res     = await apiClient.getSession(sessionId)
      const session = res.data.session
      if (session?.messages) {
        setMessages(session.messages.map(m => ({
          sources:    [],
          timestamp:  null,
          ...m,
        })))
        setActiveSessionId(session.id)
        setProgressInjected(true)
      }
    } catch (err) {
      console.error('Failed to load session:', err)
    }
    setSidebarOpen(false)
  }

  const saveSession = useCallback((updatedMessages, idOverride) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const firstUser = updatedMessages.find(m => m.role === 'user')
      const title     = firstUser
        ? firstUser.content.substring(0, 80)
        : 'New Chat'
      const currentId = idOverride ?? activeSessionId

      try {
        if (currentId) {
          await apiClient.updateSession(currentId, title, updatedMessages)
        } else {
          const res = await apiClient.createSession(title, updatedMessages)
          setActiveSessionId(res.data.session.id)
        }
        loadSessions()
      } catch (err) {
        console.error('Failed to save session:', err)
      }
    }, 1000)
  }, [activeSessionId])

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation()
    try {
      await apiClient.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSessionId === sessionId) startNewChat()
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    // ── Check free plan daily limit ────────────────────────────────────────
    const limitCheck = checkLimit('aiMessages')
    if (!limitCheck.allowed) {
      setShowUpgrade(true)
      return
    }

    setInput('')
    setLoading(true)

    const userMsg = {
      role:      'user',
      content:   text,
      sources:   [],
      timestamp: new Date().toISOString(),
    }
    const withUser = [...messages, userMsg]
    setMessages(withUser)

    try {
      const history = withUser
        .filter(m => !m.isGreeting && m.role !== 'system')
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content }))

      const progressSummary = getProgressSummary()
      const messageWithCtx  =
        `[STUDENT CONTEXT]\n${progressSummary}\n\n[QUESTION]\n${text}`

      const res     = await apiClient.chat(messageWithCtx, history)
      const reply   = res.data.reply   || ''
      const sources = Array.isArray(res.data.sources) ? res.data.sources : []

      // ── Increment usage ──────────────────────────────────────────────────
      await incrementUsage('aiMessages')

      const assistantMsg = {
        role:      'assistant',
        content:   reply,
        sources,
        timestamp: new Date().toISOString(),
      }
      const final = [...withUser, assistantMsg]
      setMessages(final)
      saveSession(final)
    } catch (err) {
      setMessages([
        ...withUser,
        {
          role:      'assistant',
          content:   `I encountered an error: ${err.message}. Please try again.`,
          sources:   [],
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickPrompts = progress.weakTopics.length > 0
    ? [
        `Explain ${progress.weakTopics[0]} for the bar exam`,
        `Practice question on ${progress.weakTopics[0]}`,
        progress.weakTopics[1]
          ? `Key rules in ${progress.weakTopics[1]}`
          : 'What should I focus on next?',
        'Build me a study plan',
      ]
    : [
        'Elements of negligence?',
        'What is the Erie doctrine?',
        'Give me a Contracts hypo',
        'How does hearsay work?',
      ]

  const PAGE_SIZE      = 15
  const pagedSessions  = sessions.slice(0, (sessionPage + 1) * PAGE_SIZE)
  const hasMoreSessions = sessions.length > pagedSessions.length
  const isNewChat = messages.length <= 1 || messages.every(m => m.isGreeting)

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">

      {/* ── Upgrade Modal ── */}
      {showUpgrade && (
        <UpgradeModal
          feature="aiMessages"
          onClose={() => setShowUpgrade(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div className={`
        fixed lg:relative inset-y-0 left-0
        w-72 lg:w-64 bg-slate-900 text-white
        flex flex-col z-40 shrink-0
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-3 border-b border-slate-700">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5
                       rounded-lg border border-slate-600
                       hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <span className="text-lg">+</span>
            New Chat
          </button>
        </div>

        {/* Progress mini card */}
        {progress.stats.totalAttempts > 0 && (
          <div className="px-3 py-3 border-b border-slate-700 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Your Progress
            </p>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Accuracy</span>
              <span className="font-bold text-blue-400">
                {progress.stats.overallAccuracy}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progress.stats.overallAccuracy}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              {progress.stats.currentStreak > 0 && (
                <p className="text-[10px] text-orange-400">
                  🔥 {progress.stats.currentStreak}-day streak
                </p>
              )}
              {progress.weakTopics.length > 0 && (
                <p className="text-[10px] text-amber-400 truncate">
                  ⚠️ {progress.weakTopics[0]}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-2">
          {sessionsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="sm" color="white" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8 px-4">
              No history yet. Start a conversation!
            </p>
          ) : (
            <div className="space-y-0.5 px-2">
              {pagedSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg text-sm
                    transition-colors group flex items-center justify-between gap-2
                    ${activeSessionId === session.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">
                      {session.title || 'Untitled Chat'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(session.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={e => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500
                               hover:text-red-400 transition-opacity shrink-0 p-1"
                    title="Delete"
                  >
                    🗑
                  </button>
                </button>
              ))}
              {hasMoreSessions && (
                <button
                  onClick={() => setSessionPage(p => p + 1)}
                  className="w-full text-center text-xs text-slate-500
                             hover:text-slate-300 py-2 transition-colors"
                >
                  Load more…
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar nav */}
        <div className="p-3 border-t border-slate-700 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Quick Navigate
          </p>
          {[
            { to: '/mock-exam', label: '📝 Mock Exam'     },
            { to: '/tutorials', label: '🎥 Tutorials'     },
            { to: '/study',     label: '📚 Study Modules' },
            { to: '/blog',      label: '📰 Blog'          },
            { to: '/pricing',   label: '⭐ Upgrade Plan'  },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="block px-3 py-2 rounded-lg text-xs text-slate-400
                         hover:bg-slate-800 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
          <p className="text-center text-slate-500 text-xs pt-2">
            {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3
                        border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(s => !s)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500
                         hover:bg-slate-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">AI Coach</h1>
              <p className="text-xs text-slate-500">
                {progress.stats.totalAttempts > 0
                  ? `${progress.stats.overallAccuracy}% accuracy • ${progress.stats.totalAttempts} questions done`
                  : 'Ask any bar exam question'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/mock-exam"
                  className="hidden sm:block text-xs text-slate-500
                             hover:text-blue-600 font-medium transition-colors">
              📝 Mock Exam
            </Link>
            <Link to="/tutorials"
                  className="hidden sm:block text-xs text-slate-500
                             hover:text-blue-600 font-medium transition-colors">
              🎥 Tutorials
            </Link>
            <button
              onClick={startNewChat}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200
                         rounded-lg hover:bg-slate-50 transition-colors"
            >
              + New
            </button>
          </div>
        </div>

        {/* Daily limit bar for free users */}
        {isFree && (
          <DailyLimitBar type="aiMessages" checkLimit={checkLimit} />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] rounded-xl px-4 py-3 text-sm
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                }
              `}>
                {msg.role === 'assistant' ? (
                  <>
                    <div className="prose prose-sm prose-slate max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400
                                      uppercase tracking-wider mb-2">
                          Sources
                        </p>
                        <ol className="space-y-1.5">
                          {msg.sources.map(s => (
                            <li key={s.number} className="text-xs flex gap-2 items-start">
                              <span className="font-mono font-bold text-slate-400 shrink-0">
                                [{s.number}]
                              </span>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800
                                           hover:underline break-words"
                                title={s.snippet}
                              >
                                {s.title}
                                <span className="text-slate-400 ml-1">
                                  ({hostFromUrl(s.url)})
                                </span>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2
                                    border-t border-slate-50">
                      <CopyButton text={msg.content} />
                      {msg.timestamp && (
                        <span className="text-[10px] text-slate-300">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.timestamp && (
                      <span className="text-[10px] text-blue-200 mt-1 block text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {loading && <TypingIndicator />}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick prompts */}
        {isNewChat && !loading && (
          <div className="px-4 py-2 bg-white border-t border-slate-100
                          flex gap-2 overflow-x-auto shrink-0">
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt)
                  inputRef.current?.focus()
                }}
                className="text-xs bg-slate-50 border border-slate-200
                           rounded-full px-3 py-1.5 whitespace-nowrap
                           hover:bg-blue-50 hover:border-blue-300
                           text-slate-600 hover:text-blue-700
                           transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className="flex gap-3 px-4 py-3 border-t border-slate-200 bg-white shrink-0"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                if (e.target.value.length <= MAX_INPUT_CHARS) {
                  setInput(e.target.value)
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isFree
                  ? `Ask a question (${checkLimit('aiMessages').remaining} messages left today)…`
                  : progress.weakTopics.length > 0
                    ? `Ask about ${progress.weakTopics[0]}…`
                    : 'Ask a bar exam question…'
              }
              rows={1}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                         text-sm resize-none focus:outline-none focus:border-blue-500
                         transition-colors max-h-32 overflow-y-auto"
              style={{ fieldSizing: 'content' }}
              disabled={loading}
            />
            {input.length > MAX_INPUT_CHARS * 0.8 && (
              <span className={`absolute bottom-2 right-3 text-[10px]
                ${input.length >= MAX_INPUT_CHARS ? 'text-red-500' : 'text-slate-400'}`}>
                {input.length}/{MAX_INPUT_CHARS}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold
                       rounded-xl hover:bg-blue-700 transition-colors
                       disabled:opacity-60 shrink-0 min-h-[44px]
                       flex items-center gap-1"
          >
            {loading
              ? <LoadingSpinner size="sm" color="white" />
              : <>Send <span className="hidden sm:inline">→</span></>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
