import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiClient, supabase } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import ReactMarkdown from 'react-markdown'
import { useProgress } from '../context/ProgressContext'

function extractYouTubeId(url) {
  if (!url) return null
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

export default function ModuleDetail() {
  const { id }                        = useParams()
  const [module, setModule]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [question, setQuestion]       = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef                 = useRef(null)

  const { progress, markModuleWatched, getProgressSummary } = useProgress()

  useEffect(() => { loadModule() }, [id])

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
        .maybeSingle()

      if (dbError) throw new Error(dbError.message)
      if (!data) throw new Error('Module not found')

      setModule(data)

      // Mark as watched in progress context
      await markModuleWatched(data.id, data.title, data.topic)

      // Build personalized greeting using student progress
      const { stats, weakTopics } = progress
      const isWeakTopic = weakTopics.includes(data.topic)

      let greeting = `Hello! I've studied this lecture on **${data.topic}** — "${data.title}".\n\n`

      if (stats.totalAttempts > 0) {
        greeting += `📊 I can see your overall accuracy is **${stats.overallAccuracy}%**. `
        if (isWeakTopic) {
          greeting += `**${data.topic}** is one of your focus areas, so let's make the most of this lecture!\n\n`
        } else {
          greeting += `\n\n`
        }
      }

      greeting += `I can help you understand the concepts covered, answer questions about the material, and quiz you on key points. What would you like to know?`

      setChatHistory([{ role: 'assistant', content: greeting }])
    } catch (err) {
      console.error('Error loading module:', err)
      setError(`Failed to load this tutorial: ${err.message || 'Unknown error'}`)
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
      { role: 'user', content: userMessage },
    ]
    setChatHistory(updatedHistory)

    try {
      // Include both module context AND student progress
      const progressSummary = getProgressSummary()
      const contextualMessage = `
[MODULE CONTEXT]
Lecture: "${module.title}" | Topic: ${module.topic}
${module.ai_summary ? `Summary: ${module.ai_summary}` : ''}

[STUDENT PROGRESS]
${progressSummary}

[STUDENT QUESTION]
${userMessage}
      `.trim()

      const res = await apiClient.chat(contextualMessage, updatedHistory.slice(-8))

      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: res.data.reply },
      ])
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: `I encountered an error: ${err.message}. Please try again.` },
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
        <Link to="/tutorials" className="btn-secondary">← Back to Tutorials</Link>
      </div>
    )
  }

  const isWeakTopic    = progress.weakTopics.includes(module.topic)
  const isStrongTopic  = progress.strongTopics.includes(module.topic)
  const topicPerf      = progress.stats.topicPerformance[module.topic]

  // Smart quick questions based on student performance
  const smartQuickQuestions = [
    isWeakTopic
      ? `I struggle with ${module.topic} — explain the basics simply`
      : 'Summarize this lecture',
    'Quiz me on this topic',
    'Key cases to know',
    isWeakTopic ? `What are common mistakes in ${module.topic}?` : 'Common exam mistakes',
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-0">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span>→</span>
        <Link to="/tutorials" className="hover:text-blue-600">Tutorials</Link>
        <span>→</span>
        <span className="text-slate-700">{module.topic}</span>
      </div>

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <span className="badge bg-blue-100 text-blue-700 text-xs px-2 py-0.5 mb-2 inline-block">
            {module.topic}
          </span>
          {isWeakTopic && (
            <span className="ml-2 badge bg-amber-100 text-amber-700 text-xs px-2 py-0.5 mb-2 inline-block">
              ⚠️ Focus Area
            </span>
          )}
          {isStrongTopic && (
            <span className="ml-2 badge bg-green-100 text-green-700 text-xs px-2 py-0.5 mb-2 inline-block">
              ✅ Strong Area
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{module.title}</h1>
        </div>

        {/* Topic Performance Badge */}
        {topicPerf && topicPerf.attempts > 0 && (
          <div className="card p-3 text-center shrink-0 min-w-[120px]">
            <div className={`text-2xl font-extrabold
              ${topicPerf.accuracy >= 75 ? 'text-green-600'
                : topicPerf.accuracy >= 50 ? 'text-blue-600'
                : 'text-amber-600'}`}>
              {topicPerf.accuracy}%
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Your Accuracy</div>
            <div className="text-xs text-slate-500">{topicPerf.attempts} attempts</div>
          </div>
        )}
      </div>

      {/* Weak Topic Alert with links */}
      {isWeakTopic && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4
                        flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              This is one of your focus areas
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {topicPerf && topicPerf.attempts > 0
                ? `You're at ${topicPerf.accuracy}% accuracy on ${module.topic}. Watch this lecture carefully and use the AI coach to reinforce concepts.`
                : `You haven't practiced ${module.topic} yet. After watching, test yourself!`}
            </p>
            <Link to="/mock-exam"
              className="inline-block mt-2 text-xs bg-amber-600 text-white
                         px-3 py-1 rounded-full hover:bg-amber-700 transition-colors">
              Practice {module.topic} Questions →
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Video Player */}
          {(() => {
            const youtubeId = extractYouTubeId(module.video_url)
            if (!youtubeId) return null
            return (
              <div className="rounded-xl overflow-hidden shadow-md bg-black aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={module.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )
          })()}
          {!extractYouTubeId(module.video_url) && (
            <div className="rounded-xl border border-dashed border-slate-300
                            bg-slate-50 aspect-video flex items-center
                            justify-center text-slate-400 text-sm">
              No video available for this tutorial
            </div>
          )}

          {/* AI Summary */}
          {module.ai_summary && (
            <div className="card">
              <h2 className="text-base font-semibold text-slate-900 mb-3">📋 What You Will Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{module.ai_summary}</p>
            </div>
          )}

          {/* Course Outline */}
          {module.ai_outline && (
            <div className="card">
              <h2 className="text-base font-semibold text-slate-900 mb-3">📚 Course Outline</h2>
              <div className="prose prose-sm prose-slate max-w-none">
                <ReactMarkdown>{module.ai_outline}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Next Steps Links */}
          <div className="card bg-slate-50 border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-700">⚡ What to Do Next</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link to="/mock-exam"
                className="flex items-center gap-2 p-3 bg-white rounded-xl
                           border border-slate-200 hover:border-blue-300
                           hover:bg-blue-50 transition-all text-sm font-medium text-slate-700">
                <span>📝</span>
                <div>
                  <div className="font-semibold text-xs">Practice Questions</div>
                  <div className="text-[10px] text-slate-500">Test your {module.topic} knowledge</div>
                </div>
              </Link>
              <Link to="/chat"
                className="flex items-center gap-2 p-3 bg-white rounded-xl
                           border border-slate-200 hover:border-blue-300
                           hover:bg-blue-50 transition-all text-sm font-medium text-slate-700">
                <span>🤖</span>
                <div>
                  <div className="font-semibold text-xs">Ask AI Coach</div>
                  <div className="text-[10px] text-slate-500">Deep dive into concepts</div>
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column - AI Chat */}
        <div className="lg:col-span-1">
          <div className="card flex flex-col h-[500px] lg:h-[600px]
                          sticky top-20 p-0 overflow-hidden">

            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm">🤖 AI Lecture Coach</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isWeakTopic
                  ? `⚠️ Focus area — I'll explain carefully`
                  : 'Ask questions about this lecture'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
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
                  <div className="bg-slate-100 rounded-xl rounded-bl-sm px-3 py-2">
                    <LoadingSpinner size="sm" text="Thinking..." />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Smart Quick Questions */}
            <div className="px-3 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto">
              {smartQuickQuestions.map((q) => (
                <button key={q} onClick={() => setQuestion(q)}
                  className="text-xs bg-slate-50 border border-slate-200
                             rounded-full px-3 py-1 whitespace-nowrap
                             hover:bg-blue-50 hover:border-blue-300
                             text-slate-600 hover:text-blue-700
                             transition-colors shrink-0">
                  {q}
                </button>
              ))}
            </div>

            <form onSubmit={askQuestion} className="p-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={isWeakTopic ? `What confuses you about ${module.topic}?` : 'Ask about this lecture...'}
                className="input-field flex-1 text-xs py-2"
                disabled={chatLoading}
              />
              <button type="submit" disabled={chatLoading || !question.trim()}
                className="btn-primary px-3 py-2 text-xs shrink-0">
                {chatLoading ? '...' : 'Ask'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
