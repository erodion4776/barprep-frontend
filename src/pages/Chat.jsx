import { useState, useRef, useEffect } from 'react'
import { apiClient } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import ReactMarkdown from 'react-markdown'

const GREETING = {
  role: 'assistant',
  content:
    "Hello! I'm your BarPrep AI Coach. I can help you understand " +
    "legal concepts, answer practice questions, and explain bar " +
    "exam topics step-by-step. What would you like to study today?",
  sources: [],
}

export default function Chat() {
  const [messages, setMessages]               = useState([GREETING])
  const [input, setInput]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [sessions, setSessions]               = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen]         = useState(false)

  const bottomRef = useRef(null)

  useEffect(() => { loadSessions() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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

  const startNewChat = () => {
    setMessages([GREETING])
    setActiveSessionId(null)
    setInput('')
    setSidebarOpen(false)
  }

  const loadSession = async (sessionId) => {
    try {
      const res = await apiClient.getSession(sessionId)
      const session = res.data.session
      if (session?.messages) {
        // Ensure old messages without a sources field still render cleanly
        setMessages(session.messages.map(m => ({ sources: [], ...m })))
        setActiveSessionId(session.id)
      }
    } catch (err) {
      console.error('Failed to load session:', err)
    }
    setSidebarOpen(false)
  }

  // Fire-and-forget so the UI unblocks the moment we get the reply.
  const saveSessionAsync = (updatedMessages, sessionIdOverride) => {
    const firstUserMsg = updatedMessages.find(m => m.role === 'user')
    const title = firstUserMsg
      ? firstUserMsg.content.substring(0, 80)
      : 'New Chat'

    const currentId = sessionIdOverride ?? activeSessionId

    ;(async () => {
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
    })()
  }

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

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    const withUser = [
      ...messages,
      { role: 'user', content: userMessage, sources: [] },
    ]
    setMessages(withUser)

    try {
      const history = withUser
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(({ role, content }) => ({ role, content }))

      const res = await apiClient.chat(userMessage, history)
      const reply   = res.data.reply || ''
      const sources = Array.isArray(res.data.sources) ? res.data.sources : []

      const finalMessages = [
        ...withUser,
        { role: 'assistant', content: reply, sources },
      ]
      setMessages(finalMessages)
      saveSessionAsync(finalMessages)   // no await; UI unblocks immediately
    } catch (err) {
      setMessages([
        ...withUser,
        {
          role: 'assistant',
          content: `I encountered an error: ${err.message}. Please try again.`,
          sources: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now  = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hrs  = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1)  return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hrs < 24)  return `${hrs}h ago`
    if (days < 7)  return `${days}d ago`
    return date.toLocaleDateString()
  }

  const hostFromUrl = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, '') }
    catch { return url }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 lg:-mx-8">

      {/* ---- Sidebar ---- */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative inset-y-0 left-0
        w-72 lg:w-64 bg-slate-900 text-white
        flex flex-col z-40
        transition-transform duration-300 ease-in-out
        lg:rounded-l-xl overflow-hidden shrink-0
      `}>
        <div className="p-3 border-b border-slate-700">
          <button onClick={startNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5
                       rounded-lg border border-slate-600
                       hover:bg-slate-800 transition-colors
                       text-sm font-medium">
            <span className="text-lg">+</span>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sessionsLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8 px-4">
              No chat history yet. Start a conversation!
            </p>
          ) : (
            <div className="space-y-0.5 px-2">
              {sessions.map((session) => (
                <button key={session.id} onClick={() => loadSession(session.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm
                    transition-colors duration-150 group flex items-center justify-between gap-2
                    ${activeSessionId === session.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{session.title || 'Untitled Chat'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(session.updated_at)}</p>
                  </div>
                  <button onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100
                               text-slate-500 hover:text-red-400
                               transition-opacity shrink-0 p-1"
                    title="Delete chat">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* ---- Main Chat ---- */}
      <div className="flex-1 flex flex-col min-w-0">

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">AI Coach</h1>
              <p className="text-xs text-slate-500">Ask any bar exam question</p>
            </div>
          </div>
          <button onClick={startNewChat} className="btn-secondary text-xs px-3 py-1.5">
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 bg-slate-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}>
                {msg.role === 'assistant' ? (
                  <>
                    <div className="prose prose-sm prose-slate max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Sources
                        </p>
                        <ol className="space-y-1.5">
                          {msg.sources.map((s) => (
                            <li key={s.number} className="text-xs flex gap-2 items-start">
                              <span className="font-mono font-bold text-slate-400 shrink-0">
                                [{s.number}]
                              </span>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline break-words"
                                title={s.snippet}
                              >
                                {s.title}
                                <span className="text-slate-400 ml-1 font-normal">
                                  ({hostFromUrl(s.url)})
                                </span>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-4 py-3 shadow-sm">
                <LoadingSpinner size="sm" text="Thinking..." />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage}
              className="flex gap-3 px-4 py-3 border-t border-slate-200 bg-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a bar exam question..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary px-5 shrink-0 min-h-[44px]">
            {loading ? '...' : 'Send'}
          </button>
        </form>

      </div>
    </div>
  )
}
