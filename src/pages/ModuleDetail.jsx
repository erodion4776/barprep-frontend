import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { apiClient } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import ReactMarkdown from 'react-markdown'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function ModuleDetail() {
  const { id }                      = useParams()
  const [module, setModule]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // AI Chat for this module
  const [question, setQuestion]     = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef               = useRef(null)

  useEffect(() => {
    loadModule()
  }, [id])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatLoading])

  const loadModule = async () => {
    setLoading(true)
    try {
      const { data, error: dbError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('id', id)
        .single()

      if (dbError) throw new Error(dbError.message)
      setModule(data)

      // Set initial AI greeting
      setChatHistory([{
        role: 'assistant',
        content: `Hello! I have studied this lecture on **${data.topic}** - "${data.title}". 
        
I can help you understand the concepts covered, answer questions about the material, and quiz you on key points. What would you like to know?`
      }])
    } catch (err) {
      setError('Failed to load this tutorial.')
    } finally {
      setLoading(false)
    }
  }

  const askQuestion = async (e) => {
    e.preventDefault()
    if (!question.trim() || chatLoading) return

    const userMessage = question.trim()
    setQuestion('')
    setChatLoading(true)

    const updatedHistory = [
      ...chatHistory,
      { role: 'user', content: userMessage }
    ]
    setChatHistory(updatedHistory)

    try {
      // Add module context to the message
      const contextualMessage = `[Regarding the bar exam lecture: "${module.title}" on ${module.topic}] ${userMessage}`

      const res = await apiClient.chat(
        contextualMessage,
        updatedHistory.slice(-8)
      )

      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: res.data.reply }
      ])
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I encountered an error: ${err.message}. Please try again.`
        }
      ])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading tutorial..." />
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-600 mb-4">❌ {error || 'Module not found'}</p>
        <Link to="/tutorials" className="btn-secondary">
          ← Back to Tutorials
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-0">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/tutorials" className="hover:text-blue-600">
          Tutorials
        </Link>
        <span>→</span>
        <span className="text-slate-700">{module.topic}</span>
      </div>

      {/* Module Header */}
      <div>
        <span className="badge bg-blue-100 text-blue-700
                         text-xs px-2 py-0.5 mb-2 inline-block">
          {module.topic}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {module.title}
        </h1>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Video + Outline */}
        <div className="lg:col-span-2 space-y-5">

          {/* Video Player */}
          {module.video_id && (
            <div className="rounded-xl overflow-hidden shadow-md
                            bg-black aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${module.video_id}`}
                title={module.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write;
                       encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* AI Summary */}
          {module.ai_summary && (
            <div className="card">
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
            <div className="card">
              <h2 className="text-base font-semibold text-slate-900 mb-3">
                📚 Course Outline
              </h2>
              <div className="prose prose-sm prose-slate max-w-none">
                <ReactMarkdown>
                  {module.ai_outline}
                </ReactMarkdown>
              </div>
            </div>
          )}

        </div>

        {/* Right Column - AI Chat */}
        <div className="lg:col-span-1">
          <div className="card flex flex-col h-[500px] lg:h-[600px]
                          sticky top-20 p-0 overflow-hidden">

            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm">
                🤖 AI Lecture Coach
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ask questions about this lecture
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] rounded-xl px-3 py-2
                    text-xs leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-xs prose-slate max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-xl rounded-bl-sm
                                  px-3 py-2">
                    <LoadingSpinner size="sm" text="Thinking..." />
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Questions */}
            <div className="px-3 py-2 border-t border-slate-100
                            flex gap-2 overflow-x-auto">
              {[
                'Summarize this lecture',
                'Quiz me on this topic',
                'Key cases to know',
                'Common exam mistakes',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
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
              className="p-3 border-t border-slate-100 flex gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about this lecture..."
                className="input-field flex-1 text-xs py-2"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !question.trim()}
                className="btn-primary px-3 py-2 text-xs shrink-0"
              >
                {chatLoading ? '...' : 'Ask'}
              </button>
            </form>

          </div>
        </div>

      </div>

    </div>
  )
}
