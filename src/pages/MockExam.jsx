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
  const [question, setQuestion] = useState('')
  const [answer, setAnswer]     = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading]   = useState(false)
  const [phase, setPhase]       = useState('select')
  const [error, setError]       = useState('')

  // Generate a new question
  const generateQuestion = async (selectedTopic) => {
    const topicToUse = selectedTopic || topic
    setLoading(true)
    setError('')
    setQuestion('')
    setAnswer('')
    setFeedback('')

    try {
      const res = await apiClient.generateQuestion(topicToUse)
      const q = res.data.reply?.trim()

      if (!q) {
        setError('Failed to generate question. Please try again.')
        setPhase('select')
        return
      }

      setQuestion(q)
      setPhase('question')
    } catch (err) {
      setError(err.message || 'Failed to generate question.')
      setPhase('select')
    } finally {
      setLoading(false)
    }
  }

  // Submit and evaluate answer
  const submitAnswer = async () => {
    if (!answer || !question) return
    setLoading(true)
    setError('')

    try {
      const res = await apiClient.evaluateAnswer(question, answer)
      const fb = res.data.reply?.trim()

      if (!fb) {
        setError('Failed to evaluate answer. Please try again.')
        return
      }

      setFeedback(fb)
      setPhase('feedback')
    } catch (err) {
      setError(err.message || 'Failed to evaluate answer.')
    } finally {
      setLoading(false)
    }
  }

  // Reset to topic selection
  const reset = () => {
    setQuestion('')
    setAnswer('')
    setFeedback('')
    setError('')
    setPhase('select')
  }

  // Generate next question on same topic
  const nextQuestion = () => {
    generateQuestion(topic)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4 sm:px-6 lg:px-0">

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

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200
                        rounded-lg text-red-700 text-sm">
          ❌ {error}
          <button
            onClick={() => setError('')}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Phase: Select Topic */}
      {phase === 'select' && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Select A Topic
          </h2>
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
            onClick={() => generateQuestion(topic)}
            disabled={loading}
            className="btn-primary w-full min-h-[48px]"
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
            <span className="badge bg-blue-100 text-blue-700
                             px-3 py-1 text-xs font-semibold">
              {topic}
            </span>
            <button
              onClick={reset}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Change Topic
            </button>
          </div>

          {/* Question */}
          <div className="prose prose-slate max-w-none
                          text-sm sm:text-base leading-relaxed">
            <ReactMarkdown>{question}</ReactMarkdown>
          </div>

          {/* Answer Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              Select Your Answer:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {['A', 'B', 'C', 'D'].map((letter) => (
                <button
                  key={letter}
                  onClick={() => setAnswer(letter)}
                  className={`p-3 rounded-lg text-sm font-semibold
                    border-2 transition-all duration-200 min-h-[48px]
                    flex items-center gap-3
                    ${answer === letter
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                >
                  <span className={`w-7 h-7 rounded-full border-2
                    flex items-center justify-center text-xs font-bold
                    shrink-0
                    ${answer === letter
                      ? 'border-white bg-white text-blue-600'
                      : 'border-slate-300 text-slate-500'
                    }`}>
                    {letter}
                  </span>
                  Option {letter}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submitAnswer}
            disabled={!answer || loading}
            className="btn-primary w-full min-h-[48px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Evaluating Your Answer...
              </span>
            ) : answer ? (
              `Submit Answer ${answer} →`
            ) : (
              'Select An Answer First'
            )}
          </button>
        </div>
      )}

      {/* Phase: Feedback */}
      {phase === 'feedback' && feedback && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge bg-blue-100 text-blue-700
                               px-3 py-1 text-xs font-semibold">
                {topic}
              </span>
              <h2 className="text-lg font-semibold text-slate-900">
                AI Feedback
              </h2>
            </div>
            <div className="prose prose-slate max-w-none
                            text-sm sm:text-base leading-relaxed">
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={nextQuestion}
              className="btn-primary flex-1 min-h-[48px]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Loading Next Question...
                </span>
              ) : (
                'Next Question →'
              )}
            </button>
            <button
              onClick={reset}
              className="btn-secondary flex-1 min-h-[48px]"
            >
              Change Topic
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
