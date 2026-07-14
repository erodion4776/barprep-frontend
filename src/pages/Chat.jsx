import { useState, useRef, useEffect } from 'react'
import { apiClient } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import ReactMarkdown from 'react-markdown'

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 
        "Hello! I'm your BarPrep AI Coach. I can help you understand legal concepts, answer practice questions, and explain bar exam topics step-by-step. What would you like to study today?",
    }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message immediately
    const updatedMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ]
    setMessages(updatedMessages)

    try {
      // Send history without the initial system greeting
      const history = updatedMessages
        .slice(1) // skip greeting
        .slice(-10) // last 10 messages only
        .map(({ role, content }) => ({ role, content }))

      const res = await apiClient.chat(userMessage, history)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.data.reply }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I encountered an error: ${err.message}. Please try again.`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Hello! I'm your BarPrep AI Coach. What would you like to study today?",
    }])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1>AI Coach</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Ask any bar exam question for instant help
          </p>
        </div>
        <button
          onClick={clearChat}
          className="btn-secondary text-sm"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 
                      pr-2 pb-4 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' 
              ? 'justify-end' 
              : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm
              ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-slate max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 
                            rounded-xl rounded-bl-sm px-4 py-3 
                            shadow-sm">
              <LoadingSpinner size="sm" text="Thinking..." />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage}
            className="flex gap-3 pt-4 border-t border-slate-200">
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
          className="btn-primary px-6 shrink-0"
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>

    </div>
  )
}
