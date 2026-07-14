import { useState } from 'react'
import { apiClient } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import ReactMarkdown from 'react-markdown'

const TOPICS = [
  'Constitutional Law',
  'Contracts',
  'Torts',
  'Criminal Law',
  'Civil Procedure',
  'Evidence',
  'Real Property',
  'Business Associations',
  'Family Law',
  'Wills & Trusts',
]

export default function MockExam() {
  const [topic, setTopic]       = useState(TOPICS[0])
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer]     = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [phase, setPhase]       = useState('select')

  const generateQuestion = async () => {
    setLoading(true)
    setFeedback(null)
    setAnswer('')
    try {
      const prompt =
        `Generate a realistic MBE-style bar exam multiple choice 
        question about ${topic}. Format exactly like this:
        
        QUESTION: [question text]
        
        A) [option]
        B) [option]
        C) [option]
        D) [option]
        
        Do not reveal the correct answer yet.`

      const res = await apiClient.chat(prompt)
      setQuestion(res.data.reply)
      setPhase('question')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer) return
    setLoading(true)
    try {
      const prompt =
        `A student answered "${answer}" to this bar exam question:
        
        ${question}
        
        Tell them if correct or incorrect then explain step-by-step
        using clear legal reasoning. Be encouraging but thorough.`

      const res = await apiClient.chat(prompt)
      setFeedback(res.data.reply)
      setPhase('feedback')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setQuestion(null)
    setAnswer('')
    setFeedback(null)
    setPhase('select')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto 
                    px-4 sm:px-6 lg:px-0">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Mock Exam
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Practice with AI-generated bar exam questions.
          Get instant feedback and step-by-step explanations.
        </p>
      </div>

      {/* Phase: Select Topic */}
      {phase === 'select' && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Select A Topic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 
                          md:grid-cols-3 gap-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`p-3 rounded-lg text-sm font-medium 
                  text-left transition-colors duration-200 border
                  min-h-[44px]
                  ${topic === t
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={generateQuestion}
            disabled={loading}
            className="btn-primary w-full min-h-[44px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Generating Question...
              </span>
            ) : (
              `Generate ${topic} Question →`
            )}
          </button>
        </div>
      )}

      {/* Phase: Answer Question */}
      {phase === 'question' && question && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between 
                          flex-wrap gap-2">
            <span className="badge bg-blue-100 text-blue-700">
              {topic}
            </span>
            <button
              onClick={reset}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← New Topic
            </button>
          </div>

          <div className="prose prose-slate max-w-none 
                          text-sm sm:text-base">
            <ReactMarkdown>{question}</ReactMarkdown>
          </div>

          {/* Answer Buttons */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Your Answer:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {['A', 'B', 'C', 'D'].map((letter) => (
                <button
                  key={letter}
                  onClick={() => setAnswer(letter)}
                  className={`p-3 rounded-lg text-sm font-semibold
                    border transition-colors duration-200 min-h-[44px]
                    ${answer === letter
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                >
                  Option {letter}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submitAnswer}
            disabled={!answer || loading}
            className="btn-primary w-full min-h-[44px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Evaluating...
              </span>
            ) : (
              'Submit Answer →'
            )}
          </button>
        </div>
      )}

      {/* Phase: Show Feedback */}
      {phase === 'feedback' && feedback && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              AI Feedback
            </h2>
            <div className="prose prose-slate max-w-none 
                            text-sm sm:text-base">
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generateQuestion}
              className="btn-primary flex-1 min-h-[44px]"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Next Question →'}
            </button>
            <button
              onClick={reset}
              className="btn-secondary flex-1 min-h-[44px]"
            >
              Change Topic
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
