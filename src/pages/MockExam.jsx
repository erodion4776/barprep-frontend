import { useState, useEffect } from 'react'
import { apiClient, supabase } from '../api/client'
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

// Fallback parser for legacy rows that predate the is_correct column.
// Returns true, false, or null (unknown — do NOT guess).
const legacyGrade = (feedbackText, selectedAnswer) => {
  if (!feedbackText || !selectedAnswer) return null
  const text = feedbackText.replace(/<!-- grading: \{.*?\} -->\s*/g, '')
  const m =
    text.match(/##\s*Correct Answer\s*\n+\s*\(?([A-D])\)?/i) ||
    text.match(/correct\s+answer\s*(?:is|:)\s*\(?([A-D])\)?/i)
  if (!m) return null
  return m[1].toUpperCase() === selectedAnswer.toUpperCase()
}

const parseAttemptGrading = (attempt) => {
  if (attempt.is_correct !== null && attempt.is_correct !== undefined) {
    return {
      isCorrect: attempt.is_correct,
      score: attempt.score ?? (attempt.is_correct ? 100 : 0),
      timeTaken: attempt.time_taken ?? 0,
    }
  }
  const isCorrect = legacyGrade(attempt.feedback || '', attempt.answer)
  return {
    isCorrect, // may be null
    score: isCorrect ? 100 : 0,
    timeTaken: attempt.time_taken ?? 0,
  }
}

const stripLegacyMarker = (text = '') =>
  text.replace(/<!-- grading: \{.*?\} -->\s*/g, '').trim()

const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function MockExam() {
  const [topic, setTopic]     = useState(TOPICS[0])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer]     = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading]   = useState(false)
  const [phase, setPhase]       = useState('select')
  const [error, setError]       = useState('')

  // Answer key received from generate; used during evaluate. Never shown to user.
  const [correctLetter, setCorrectLetter] = useState(null)
  const [rationale, setRationale]         = useState('')

  // Grading results from most recent submit
  const [lastIsCorrect, setLastIsCorrect]         = useState(null)
  const [lastCorrectLetter, setLastCorrectLetter] = useState(null)
  const [finalTimeTaken, setFinalTimeTaken]       = useState(0)

  // Timer
  const [timeMode, setTimeMode]         = useState('countdown')
  const [secondsLeft, setSecondsLeft]   = useState(108)
  const [secondsSpent, setSecondsSpent] = useState(0)
  const [timerActive, setTimerActive]   = useState(false)

  // History & analytics
  const [history, setHistory]               = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [stats, setStats] = useState({
    totalAttempts: 0,
    totalCorrect: 0,
    averageTime: 0,
    topicPerformance: {},
  })

  useEffect(() => { loadHistoryAndStats() }, [])

  useEffect(() => {
    let interval = null
    if (phase === 'question' && timerActive) {
      interval = setInterval(() => {
        if (timeMode === 'countdown') {
          setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
          setSecondsSpent((prev) => prev + 1)
        } else {
          setSecondsSpent((prev) => prev + 1)
        }
      }, 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [phase, timerActive, timeMode])

  const loadHistoryAndStats = async () => {
    setLoadingHistory(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!data) return

      setHistory(data)

      let totalCorrect = 0
      let totalTime = 0
      let timedCount = 0
      let gradedCount = 0
      const topicPerf = {}
      TOPICS.forEach(t => {
        topicPerf[t] = { attempts: 0, correct: 0, accuracy: 0, avgTime: 0, totalTime: 0 }
      })

      data.forEach(attempt => {
        const g = parseAttemptGrading(attempt)
        if (g.isCorrect === null) return // skip ungraded rows entirely

        gradedCount++
        if (g.isCorrect) totalCorrect++
        if (g.timeTaken > 0) { totalTime += g.timeTaken; timedCount++ }

        const t = attempt.topic || 'General'
        if (!topicPerf[t]) {
          topicPerf[t] = { attempts: 0, correct: 0, accuracy: 0, avgTime: 0, totalTime: 0 }
        }
        topicPerf[t].attempts++
        if (g.isCorrect) topicPerf[t].correct++
        if (g.timeTaken > 0) topicPerf[t].totalTime += g.timeTaken
      })

      Object.keys(topicPerf).forEach(t => {
        const item = topicPerf[t]
        if (item.attempts > 0) {
          item.accuracy = Math.round((item.correct / item.attempts) * 100)
          item.avgTime = Math.round(item.totalTime / item.attempts)
        }
      })

      setStats({
        totalAttempts: gradedCount,
        totalCorrect,
        averageTime: timedCount > 0 ? Math.round(totalTime / timedCount) : 0,
        topicPerformance: topicPerf,
      })
    } catch (err) {
      console.error('Error loading history and stats:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const generateQuestion = async (selectedTopic) => {
    const topicToUse = selectedTopic || topic
    setLoading(true); setError('')
    setQuestion(''); setAnswer(''); setFeedback('')
    setCorrectLetter(null); setRationale('')
    setLastIsCorrect(null); setLastCorrectLetter(null)
    setSecondsSpent(0); setSecondsLeft(108); setTimerActive(false)

    try {
      const res = await apiClient.generateQuestion(topicToUse)
      const { question: q, correct_letter, rationale: r } = res.data || {}
      if (!q || !correct_letter) {
        setError('Failed to generate a valid question. Please try again.')
        setPhase('select')
        return
      }
      setQuestion(q)
      setCorrectLetter(correct_letter)
      setRationale(r || '')
      setPhase('question')
      setTimerActive(true)
    } catch (err) {
      setError(err.message || 'Failed to generate question.')
      setPhase('select')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer || !question || !correctLetter) return
    setLoading(true); setError('')
    setTimerActive(false)
    const finalTime = secondsSpent

    try {
      const res = await apiClient.evaluateAnswer(question, answer, correctLetter, rationale)
      const { reply: fb, is_correct, correct_letter } = res.data || {}
      if (!fb) { setError('Failed to evaluate answer. Please try again.'); return }

      setFinalTimeTaken(finalTime)
      setLastIsCorrect(is_correct)
      setLastCorrectLetter(correct_letter)
      setFeedback(fb)
      setPhase('feedback')

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: insertErr } = await supabase.from('attempts').insert({
          user_id: user.id,
          question,
          answer,
          feedback: fb,
          topic,
          is_correct,
          score: is_correct ? 100 : 0,
          time_taken: finalTime,
          correct_letter,
        })
        if (insertErr) console.error('Failed to save attempt:', insertErr)
        loadHistoryAndStats()
      }
    } catch (err) {
      setError(err.message || 'Failed to evaluate answer.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setQuestion(''); setAnswer(''); setFeedback('')
    setError(''); setTimerActive(false)
    setCorrectLetter(null); setRationale('')
    setLastIsCorrect(null); setLastCorrectLetter(null)
    setPhase('select')
    loadHistoryAndStats()
  }

  const nextQuestion = () => { generateQuestion(topic) }

  const testedTopics = Object.entries(stats.topicPerformance).filter(([, info]) => info.attempts > 0)
  const strongestAreas = testedTopics
    .filter(([, info]) => info.accuracy >= 75)
    .map(([name, info]) => ({ name, ...info }))
    .sort((a, b) => b.accuracy - a.accuracy)
  const improvingAreas = testedTopics
    .filter(([, info]) => info.accuracy >= 50 && info.accuracy < 75)
    .map(([name, info]) => ({ name, ...info }))
    .sort((a, b) => b.accuracy - a.accuracy)
  const focusAreas = Object.entries(stats.topicPerformance)
    .filter(([, info]) => info.attempts === 0 || info.accuracy < 50)
    .map(([name, info]) => ({ name, ...info }))
    .sort((a, b) => a.attempts - b.attempts || a.accuracy - b.accuracy)

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Mock Exam & Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Practice with real-time pacing feedback, grading logs, and topic strength diagnostics.
          </p>
        </div>
        {phase === 'select' && history.length > 0 && (
          <button onClick={loadHistoryAndStats}
            className="self-start sm:self-center btn-secondary text-sm flex items-center gap-1">
            🔄 Refresh Stats
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="underline text-xs font-semibold hover:text-red-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Phase: Select */}
      {phase === 'select' && (
        <div className="space-y-8">

          {history.length > 0 && stats.totalAttempts > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-xl">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Practice Questions Answered</div>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalAttempts}</div>
                <div className="text-xs text-slate-500 mt-1">Keep up the great study momentum!</div>
              </div>
              <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-xl">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Overall Accuracy</div>
                <div className="text-3xl font-extrabold text-blue-600 mt-2">
                  {stats.totalAttempts > 0 ? `${Math.round((stats.totalCorrect / stats.totalAttempts) * 100)}%` : '0%'}
                </div>
                <div className="text-xs text-slate-500 mt-1">{stats.totalCorrect} correct answers recorded</div>
              </div>
              <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-xl">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Average Response Pacing</div>
                <div className="text-3xl font-extrabold text-indigo-600 mt-2">
                  {stats.averageTime > 0 ? formatTime(stats.averageTime) : 'N/A'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.averageTime > 108 ? '⚠️ Pace is slower than 1:48 limit' : '✅ Excellent exam pacing!'}
                </div>
              </div>
            </div>
          )}

          {history.length > 0 && stats.totalAttempts > 0 && (
            <div className="card bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Topic Performance Report</h2>
                <p className="text-slate-500 text-xs mt-0.5">Automated diagnostic based on your historical mock exam scoring.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1">🏆 Strongest Areas (≥75%)</h3>
                  {strongestAreas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No areas in master zone yet. Keep practicing!</p>
                  ) : (
                    <div className="space-y-2.5">
                      {strongestAreas.map(item => (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-slate-800">
                            <span>{item.name}</span>
                            <span className="text-green-600">{item.accuracy}% ({item.correct}/{item.attempts})</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${item.accuracy}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">📈 Improving Areas (50%-74%)</h3>
                  {improvingAreas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No topics currently in intermediate zone.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {improvingAreas.map(item => (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-slate-800">
                            <span>{item.name}</span>
                            <span className="text-blue-600">{item.accuracy}% ({item.correct}/{item.attempts})</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${item.accuracy}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">⚠️ Focus Areas (&lt;50% / untested)</h3>
                  {focusAreas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Incredible! All active topics are in good shape.</p>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {focusAreas.slice(0, 6).map(item => (
                        <div key={item.name} className="flex justify-between items-center text-xs text-slate-700 py-1 border-b border-slate-50 last:border-b-0">
                          <span className="font-medium truncate max-w-[150px]">{item.name}</span>
                          <span className="text-slate-400 font-medium shrink-0">
                            {item.attempts > 0 ? `${item.accuracy}% accuracy` : 'Untested'}
                          </span>
                        </div>
                      ))}
                      {focusAreas.length > 6 && (
                        <div className="text-[10px] text-slate-400 text-center pt-1 italic">
                          + {focusAreas.length - 6} more topics to practice
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Topic Selector */}
          <div className="card space-y-5 bg-white border border-slate-200 p-6 rounded-2xl">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-lg font-bold text-slate-900">Choose Practice Exam Topic</h2>
              <span className="text-xs text-slate-400 font-mono">Click a topic to generate an MBE-style question</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {TOPICS.map((t) => {
                const perf = stats.topicPerformance[t]
                const attemptCount = perf?.attempts || 0
                return (
                  <button key={t} onClick={() => setTopic(t)}
                    className={`p-3.5 rounded-xl text-sm font-semibold text-left transition-all duration-200 border flex flex-col justify-between min-h-[64px]
                      ${topic === t
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm ring-1 ring-blue-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <span>{t}</span>
                    {attemptCount > 0 && (
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Accuracy: {perf.accuracy}% ({attemptCount} attempts)
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <button onClick={() => generateQuestion(topic)} disabled={loading}
              className="btn-primary w-full min-h-[48px] py-3 text-base flex justify-center items-center rounded-xl">
              {loading
                ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />Spinning up AI Question Generator...</span>
                : `Launch ${topic} Mock Question →`}
            </button>
          </div>

          {history.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Practice Log & Performance History</h3>
              <div className="space-y-3">
                {history.slice(0, 5).map((attempt, index) => {
                  const g = parseAttemptGrading(attempt)
                  const label = g.isCorrect === null ? 'Ungraded' : g.isCorrect ? 'Correct' : 'Incorrect'
                  const dotColor = g.isCorrect === null ? 'bg-slate-300' : g.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  const badgeColor = g.isCorrect === null
                    ? 'bg-slate-100 text-slate-600'
                    : g.isCorrect
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  return (
                    <details key={attempt.id || index}
                      className="group card bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-0 overflow-hidden transition-all duration-200">
                      <summary className="flex items-center justify-between p-4 cursor-pointer select-none list-none">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`} />
                          <div>
                            <span className="text-sm font-semibold text-slate-900">
                              {attempt.topic || 'General Mock Exam'}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              Answered Option: {attempt.answer || 'N/A'} • {attempt.created_at ? new Date(attempt.created_at).toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>{label}</span>
                          {g.timeTaken > 0 && (
                            <span className="text-xs text-slate-500 font-mono">⏱️ {formatTime(g.timeTaken)}</span>
                          )}
                          <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 text-xs">▼</span>
                        </div>
                      </summary>

                      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4 text-sm text-slate-700 leading-relaxed">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Question Content:</h4>
                          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs max-h-[150px] overflow-y-auto">
                            <ReactMarkdown>{attempt.question}</ReactMarkdown>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">AI Evaluator Feedback:</h4>
                          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs prose prose-slate">
                            <ReactMarkdown>{stripLegacyMarker(attempt.feedback)}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </details>
                  )
                })}
                {history.length > 5 && (
                  <p className="text-slate-400 text-center text-xs italic">
                    Showing latest 5 of {history.length} logged exam attempts. Past questions are saved automatically.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Phase: Question */}
      {phase === 'question' && question && (
        <div className="card bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-6">

          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="badge bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{topic}</span>
              <span className="text-slate-400 text-xs">Paced Mock Exam</span>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <button onClick={() => setTimeMode(timeMode === 'countdown' ? 'stopwatch' : 'countdown')}
                  className="font-semibold underline text-blue-600 hover:text-blue-800 transition"
                  title="Switch timer mode">
                  {timeMode === 'countdown' ? 'MBE Pace (1:48)' : 'Stopwatch'}
                </button>
              </div>

              <div className={`text-base font-mono font-bold flex items-center gap-1
                ${timeMode === 'countdown' && secondsLeft <= 20
                  ? 'text-red-500 animate-pulse'
                  : timeMode === 'countdown' && secondsLeft <= 45
                    ? 'text-amber-500'
                    : 'text-slate-700'}`}>
                <span>⏱️</span>
                <span>{timeMode === 'countdown' ? formatTime(secondsLeft) : formatTime(secondsSpent)}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed bg-slate-50/40 p-4 rounded-xl border border-slate-100">
            <ReactMarkdown>{question}</ReactMarkdown>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Option:</p>
              {timeMode === 'countdown' && secondsLeft === 0 && (
                <span className="text-xs font-semibold text-red-500">⏱️ Time's Up! Make your best guess.</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['A', 'B', 'C', 'D'].map((letter) => (
                <button key={letter} onClick={() => setAnswer(letter)}
                  className={`p-3.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 min-h-[52px] flex items-center gap-3
                    ${answer === letter
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'}`}>
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                    ${answer === letter
                      ? 'border-white bg-white text-blue-600'
                      : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                    {letter}
                  </span>
                  Option {letter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={submitAnswer} disabled={!answer || loading}
              className="btn-primary flex-1 min-h-[48px] text-sm py-3 font-semibold rounded-xl">
              {loading
                ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />Running AI Scoring Evaluator...</span>
                : answer ? `Grade Answer Choice ${answer} →` : 'Select An Answer Option First'}
            </button>
            <button onClick={reset} disabled={loading}
              className="btn-secondary text-sm px-5 py-3 rounded-xl hover:bg-slate-200">
              Abandon Attempt
            </button>
          </div>
        </div>
      )}

      {/* Phase: Feedback */}
      {phase === 'feedback' && feedback && (
        <div className="space-y-6">

          <div className={`card p-6 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-sm
            ${lastIsCorrect ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold text-white tracking-wide uppercase
                  ${lastIsCorrect ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {lastIsCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                </span>
                <span className="text-slate-400 text-xs">Topic: {topic}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 pt-1">
                {lastIsCorrect ? 'Superb! Spot On Analysis' : 'Incorrect selection'}
              </h2>
              <p className="text-slate-600 text-xs">
                You selected Option <span className="font-bold">{answer}</span>.
                {!lastIsCorrect && lastCorrectLetter && (
                  <> The correct answer was <span className="font-bold">{lastCorrectLetter}</span>.</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200/50 pt-4 sm:pt-0 sm:pl-6 shrink-0">
              <div className="text-center">
                <div className={`text-3xl font-black font-mono ${lastIsCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {lastIsCorrect ? '100%' : '0%'}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Grade Score</div>
              </div>
              <div className="w-px h-10 bg-slate-200/50" />
              <div className="text-center">
                <div className="text-3xl font-black font-mono text-slate-700">{formatTime(finalTimeTaken)}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Time Pacing</div>
              </div>
            </div>
          </div>

          <div className="card bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              ⚖️ Detailed Explanations & Rationale
            </h3>
            <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed">
              <ReactMarkdown>{stripLegacyMarker(feedback)}</ReactMarkdown>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={nextQuestion} disabled={loading}
              className="btn-primary flex-1 min-h-[48px] py-3 font-semibold rounded-xl text-base flex justify-center items-center">
              {loading
                ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />Spinning up Next Question...</span>
                : 'Generate Next Question →'}
            </button>
            <button onClick={reset}
              className="btn-secondary flex-1 min-h-[48px] py-3 rounded-xl text-base bg-slate-100 hover:bg-slate-200">
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
