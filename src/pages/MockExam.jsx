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

// Helper to check correctness of answer from feedback text
const checkCorrectness = (feedbackText, selectedAnswer) => {
  const text = feedbackText.toLowerCase()
  
  // Direct statements indicating correctness
  if (
    text.includes("your answer is correct") || 
    text.includes("you are correct") || 
    text.includes("you correctly identified") || 
    text.includes("you chose the correct option") || 
    text.includes("your selection is correct")
  ) {
    return true
  }
  
  // Direct statements indicating incorrectness
  if (
    text.includes("your answer is incorrect") || 
    text.includes("is incorrect") || 
    text.includes("incorrectly")
  ) {
    if (
      text.includes("your answer is incorrect") || 
      text.includes("you did not select the correct") || 
      text.includes("incorrect choice")
    ) {
      return false
    }
  }

  // Look for correct option declaration
  const correctOptionRegexes = [
    /the correct answer is\s*([a-d])/i,
    /the correct option is\s*([a-d])/i,
    /correct choice:?\s*([a-d])/i,
    /correct answer:?\s*([a-d])/i,
    /correct option:?\s*([a-d])/i,
    /correct:?\s*([a-d])\b/i
  ]

  for (const r of correctOptionRegexes) {
    const match = feedbackText.match(r)
    if (match) {
      const parsedCorrect = match[1].toUpperCase()
      return parsedCorrect === selectedAnswer.toUpperCase()
    }
  }

  // Score representation (e.g. "Score: 1/1" or "1 out of 1")
  if (text.includes("score: 1/1") || text.includes("score: 1 / 1") || text.includes("1 out of 1")) {
    return true
  }
  if (text.includes("score: 0/1") || text.includes("score: 0 / 1") || text.includes("0 out of 1")) {
    return false
  }

  // Proximity check in lines
  const paragraphs = text.split('\n')
  for (const p of paragraphs) {
    if (p.includes(`correct`) && p.includes(`option ${selectedAnswer.toLowerCase()}`)) {
      return true
    }
    if (p.includes(`correct`) && p.includes(`choice ${selectedAnswer.toLowerCase()}`)) {
      return true
    }
  }

  // Ultimate fallback
  return text.includes("correct") && !text.includes("incorrect")
}

// Helper to parse grading metadata from a loaded attempt
const parseAttemptGrading = (attempt) => {
  if (attempt.is_correct !== undefined && attempt.is_correct !== null) {
    return {
      isCorrect: attempt.is_correct,
      score: attempt.score ?? (attempt.is_correct ? 100 : 0),
      timeTaken: attempt.time_taken ?? 0
    }
  }

  const markerMatch = attempt.feedback?.match(/<!-- grading: (\{.*?\}) -->/)
  if (markerMatch) {
    try {
      const parsed = JSON.parse(markerMatch[1])
      return {
        isCorrect: parsed.is_correct,
        score: parsed.score,
        timeTaken: parsed.time_taken
      }
    } catch (e) {
      // ignore
    }
  }

  const isCorrect = checkCorrectness(attempt.feedback || '', attempt.answer)
  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
    timeTaken: 0
  }
}

// Formatter for seconds
const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function MockExam() {
  const [topic, setTopic]       = useState(TOPICS[0])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer]     = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading]   = useState(false)
  const [phase, setPhase]       = useState('select')
  const [error, setError]       = useState('')

  // Timer States
  const [timeMode, setTimeMode]           = useState('countdown') // 'countdown' or 'stopwatch'
  const [secondsLeft, setSecondsLeft]     = useState(108) // 1m 48s standard MBE pace
  const [secondsSpent, setSecondsSpent]   = useState(0)
  const [timerActive, setTimerActive]     = useState(false)
  const [finalTimeTaken, setFinalTimeTaken] = useState(0)

  // History & Student Analytics Dashboard States
  const [history, setHistory]               = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [stats, setStats] = useState({
    totalAttempts: 0,
    totalCorrect: 0,
    averageTime: 0,
    topicPerformance: {}
  })

  // Load user history & stats on mount
  useEffect(() => {
    loadHistoryAndStats()
  }, [])

  // Timer Interval Effect
  useEffect(() => {
    let interval = null
    if (phase === 'question' && timerActive) {
      interval = setInterval(() => {
        if (timeMode === 'countdown') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
          setSecondsSpent((prev) => prev + 1)
        } else {
          setSecondsSpent((prev) => prev + 1)
        }
      }, 1000)
    } else {
      if (interval) clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
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

      if (data) {
        setHistory(data)
        
        let totalCorrect = 0
        let totalTime = 0
        let timedCount = 0
        const topicPerf = {}

        // Initialize all topics
        TOPICS.forEach(t => {
          topicPerf[t] = { attempts: 0, correct: 0, accuracy: 0, avgTime: 0, totalTime: 0 }
        })

        data.forEach(attempt => {
          const grading = parseAttemptGrading(attempt)
          
          if (grading.isCorrect) {
            totalCorrect++
          }

          if (grading.timeTaken > 0) {
            totalTime += grading.timeTaken
            timedCount++
          }

          const t = attempt.topic || 'General'
          if (!topicPerf[t]) {
            topicPerf[t] = { attempts: 0, correct: 0, accuracy: 0, avgTime: 0, totalTime: 0 }
          }
          topicPerf[t].attempts++
          if (grading.isCorrect) {
            topicPerf[t].correct++
          }
          if (grading.timeTaken > 0) {
            topicPerf[t].totalTime += grading.timeTaken
          }
        })

        // Compute accuracy and speeds per topic
        Object.keys(topicPerf).forEach(t => {
          const item = topicPerf[t]
          if (item.attempts > 0) {
            item.accuracy = Math.round((item.correct / item.attempts) * 100)
            item.avgTime = Math.round(item.totalTime / item.attempts)
          } else {
            item.accuracy = 0
            item.avgTime = 0
          }
        })

        setStats({
          totalAttempts: data.length,
          totalCorrect,
          averageTime: timedCount > 0 ? Math.round(totalTime / timedCount) : 0,
          topicPerformance: topicPerf
        })
      }
    } catch (err) {
      console.error('Error loading history and stats:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Generate a new question
  const generateQuestion = async (selectedTopic) => {
    const topicToUse = selectedTopic || topic
    setLoading(true)
    setError('')
    setQuestion('')
    setAnswer('')
    setFeedback('')
    
    // Reset timer config
    setSecondsSpent(0)
    setSecondsLeft(108) // 1 minute 48 seconds standard MBE limit
    setTimerActive(false)

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
      setTimerActive(true) // Start pacing timer immediately on question load!
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
    
    // Pause timer
    setTimerActive(false)
    const finalTime = secondsSpent

    try {
      const res = await apiClient.evaluateAnswer(question, answer)
      const fb = res.data.reply?.trim()

      if (!fb) {
        setError('Failed to evaluate answer. Please try again.')
        return
      }

      // Determine score & grading
      const isCorrect = checkCorrectness(fb, answer)
      const scoreValue = isCorrect ? 100 : 0
      setFinalTimeTaken(finalTime)

      // Package metadata & prepend to feedback for highly resilient storage
      const gradingMetadata = {
        is_correct: isCorrect,
        score: scoreValue,
        time_taken: finalTime
      }
      const enrichedFeedback = `<!-- grading: ${JSON.stringify(gradingMetadata)} -->\n\n${fb}`

      setFeedback(enrichedFeedback)
      setPhase('feedback')

      // Save attempt to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          const { error: insertErr } = await supabase.from('attempts').insert({
            user_id: user.id,
            question,
            answer,
            feedback: enrichedFeedback,
            topic,
            is_correct: isCorrect,
            score: scoreValue,
            time_taken: finalTime
          })
          
          if (insertErr && insertErr.code === '42703') {
            // Missing explicit database column fallback
            await supabase.from('attempts').insert({
              user_id: user.id,
              question,
              answer,
              feedback: enrichedFeedback,
              topic
            })
          } else if (insertErr) {
            throw insertErr
          }
        } catch (dbErr) {
          console.warn('Database write issue, falling back to default logging:', dbErr)
          await supabase.from('attempts').insert({
            user_id: user.id,
            question,
            answer,
            feedback: enrichedFeedback,
            topic
          })
        }
        
        // Refresh local student report immediately
        loadHistoryAndStats()
      }
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
    setTimerActive(false)
    setPhase('select')
    loadHistoryAndStats()
  }

  // Generate next question on same topic
  const nextQuestion = () => {
    generateQuestion(topic)
  }

  // Derived Analytics groupings:
  const testedTopics = Object.entries(stats.topicPerformance).filter(([_, info]) => info.attempts > 0)
  
  const strongestAreas = testedTopics
    .filter(([_, info]) => info.accuracy >= 75)
    .map(([name, info]) => ({ name, ...info }))
    .sort((a, b) => b.accuracy - a.accuracy)

  const improvingAreas = testedTopics
    .filter(([_, info]) => info.accuracy >= 50 && info.accuracy < 75)
    .map(([name, info]) => ({ name, ...info }))
    .sort((a, b) => b.accuracy - a.accuracy)

  const focusAreas = Object.entries(stats.topicPerformance)
    .filter(([_, info]) => info.attempts === 0 || info.accuracy < 50)
    .map(([name, info]) => ({ name, ...info }))
    .sort((a, b) => a.attempts - b.attempts || a.accuracy - b.accuracy)

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Mock Exam & Analytics
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Practice with real-time pacing feedback, grading logs, and topic strength diagnostics.
          </p>
        </div>
        {phase === 'select' && history.length > 0 && (
          <button 
            onClick={loadHistoryAndStats}
            className="self-start sm:self-center btn-secondary text-sm flex items-center gap-1"
          >
            🔄 Refresh Stats
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="underline text-xs font-semibold hover:text-red-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Phase: Select Topic / Analytics Dashboard */}
      {phase === 'select' && (
        <div className="space-y-8">
          
          {/* Quick Stats Grid */}
          {history.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-xl">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Practice Questions Answered
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">
                  {stats.totalAttempts}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Keep up the great study momentum!
                </div>
              </div>

              <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-xl">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Overall Accuracy
                </div>
                <div className="text-3xl font-extrabold text-blue-600 mt-2">
                  {stats.totalAttempts > 0 
                    ? `${Math.round((stats.totalCorrect / stats.totalAttempts) * 100)}%` 
                    : '0%'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.totalCorrect} correct answers recorded
                </div>
              </div>

              <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-xl">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Average Response Pacing
                </div>
                <div className="text-3xl font-extrabold text-indigo-600 mt-2">
                  {stats.averageTime > 0 ? formatTime(stats.averageTime) : 'N/A'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.averageTime > 108 
                    ? '⚠️ Pace is slower than 1:48 limit' 
                    : '✅ Excellent exam pacing!'}
                </div>
              </div>
            </div>
          )}

          {/* Strengths & Focus Areas Section */}
          {history.length > 0 && (
            <div className="card bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Topic Performance Report</h2>
                <p className="text-slate-500 text-xs mt-0.5">Automated diagnostic based on your historical mock exam scoring.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 🏆 Strongest Areas */}
                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1">
                    🏆 Strongest Areas (≥75%)
                  </h3>
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

                {/* 📈 Improving Areas */}
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                    📈 Improving Areas (50%-74%)
                  </h3>
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

                {/* ⚠️ Focus Areas */}
                <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    ⚠️ Focus Areas (&lt;50% / untested)
                  </h3>
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
              <h2 className="text-lg font-bold text-slate-900">
                Choose Practice Exam Topic
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Click a topic to generate an MBE-style question
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {TOPICS.map((t) => {
                const perf = stats.topicPerformance[t]
                const attemptCount = perf?.attempts || 0
                return (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`p-3.5 rounded-xl text-sm font-semibold text-left transition-all duration-200 border flex flex-col justify-between min-h-[64px]
                      ${topic === t
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm ring-1 ring-blue-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
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

            <button
              onClick={() => generateQuestion(topic)}
              disabled={loading}
              className="btn-primary w-full min-h-[48px] py-3 text-base flex justify-center items-center rounded-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Spinning up AI Question Generator...
                </span>
              ) : (
                `Launch ${topic} Mock Question →`
              )}
            </button>
          </div>

          {/* Past Attempts History List */}
          {history.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Practice Log & Performance History
              </h3>

              <div className="space-y-3">
                {history.slice(0, 5).map((attempt, index) => {
                  const grading = parseAttemptGrading(attempt)
                  return (
                    <details 
                      key={attempt.id || index} 
                      className="group card bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-0 overflow-hidden transition-all duration-200"
                    >
                      <summary className="flex items-center justify-between p-4 cursor-pointer select-none list-none">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${grading.isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
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
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${grading.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {grading.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          {grading.timeTaken > 0 && (
                            <span className="text-xs text-slate-500 font-mono">
                              ⏱️ {formatTime(grading.timeTaken)}
                            </span>
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
                            {/* Strip embedded grading code before displaying feedback to user */}
                            <ReactMarkdown>
                              {attempt.feedback?.replace(/<!-- grading: \{.*?\} -->/g, '').trim()}
                            </ReactMarkdown>
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

      {/* Phase: Answer Question */}
      {phase === 'question' && question && (
        <div className="card bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-6">
          
          {/* Question Header & Timer Control */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="badge bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {topic}
              </span>
              <span className="text-slate-400 text-xs">Paced Mock Exam</span>
            </div>
            
            {/* Countdown / Stopwatch Interactive Widget */}
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <button 
                  onClick={() => {
                    setTimeMode(timeMode === 'countdown' ? 'stopwatch' : 'countdown')
                  }}
                  className="font-semibold underline text-blue-600 hover:text-blue-800 transition"
                  title="Switch timer mode"
                >
                  {timeMode === 'countdown' ? 'MBE Pace (1:48)' : 'Stopwatch'}
                </button>
              </div>

              <div className={`text-base font-mono font-bold flex items-center gap-1
                ${timeMode === 'countdown' && secondsLeft <= 20 
                  ? 'text-red-500 animate-pulse' 
                  : timeMode === 'countdown' && secondsLeft <= 45 
                  ? 'text-amber-500' 
                  : 'text-slate-700'
                }`}
              >
                <span>⏱️</span>
                <span>
                  {timeMode === 'countdown' ? formatTime(secondsLeft) : formatTime(secondsSpent)}
                </span>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed bg-slate-50/40 p-4 rounded-xl border border-slate-100">
            <ReactMarkdown>{question}</ReactMarkdown>
          </div>

          {/* Answer Choice Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Select Option:
              </p>
              {timeMode === 'countdown' && secondsLeft === 0 && (
                <span className="text-xs font-semibold text-red-500">⏱️ Time's Up! Make your best guess.</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['A', 'B', 'C', 'D'].map((letter) => (
                <button
                  key={letter}
                  onClick={() => setAnswer(letter)}
                  className={`p-3.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 min-h-[52px] flex items-center gap-3
                    ${answer === letter
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                >
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                    ${answer === letter
                      ? 'border-white bg-white text-blue-600'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                    {letter}
                  </span>
                  Option {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Control Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={submitAnswer}
              disabled={!answer || loading}
              className="btn-primary flex-1 min-h-[48px] text-sm py-3 font-semibold rounded-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Running AI Scoring Evaluator...
                </span>
              ) : answer ? (
                `Grade Answer Choice ${answer} →`
              ) : (
                'Select An Answer Option First'
              )}
            </button>
            <button
              onClick={reset}
              disabled={loading}
              className="btn-secondary text-sm px-5 py-3 rounded-xl hover:bg-slate-200"
            >
              Abandon Attempt
            </button>
          </div>
        </div>
      )}

      {/* Phase: Feedback */}
      {phase === 'feedback' && feedback && (
        <div className="space-y-6">
          
          {/* Score & Grading Dashboard Card */}
          {(() => {
            const isCorrectAnswer = checkCorrectness(feedback, answer)
            return (
              <div className={`card p-6 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-sm
                ${isCorrectAnswer 
                  ? 'bg-emerald-50/80 border-emerald-200' 
                  : 'bg-rose-50/80 border-rose-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold text-white tracking-wide uppercase
                      ${isCorrectAnswer ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                      {isCorrectAnswer ? 'Correct Answer' : 'Incorrect Answer'}
                    </span>
                    <span className="text-slate-400 text-xs">Topic: {topic}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 pt-1">
                    {isCorrectAnswer ? 'Superb! Spot On Analysis' : 'Incorrect selection'}
                  </h2>
                  <p className="text-slate-600 text-xs">
                    You selected Option <span className="font-bold">{answer}</span>. Review the grading details and explanation below.
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200/50 pt-4 sm:pt-0 sm:pl-6 shrink-0">
                  <div className="text-center">
                    <div className={`text-3xl font-black font-mono ${isCorrectAnswer ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isCorrectAnswer ? '100%' : '0%'}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Grade Score</div>
                  </div>

                  <div className="w-px h-10 bg-slate-200/50" />

                  <div className="text-center">
                    <div className="text-3xl font-black font-mono text-slate-700">
                      {formatTime(finalTimeTaken)}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Time Pacing</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* AI Explanation Details */}
          <div className="card bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              ⚖️ Detailed Explanations & Rationale
            </h3>
            
            <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed">
              {/* Strip embedded grading code before displaying feedback to user */}
              <ReactMarkdown>
                {feedback?.replace(/<!-- grading: \{.*?\} -->/g, '').trim()}
              </ReactMarkdown>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={nextQuestion}
              className="btn-primary flex-1 min-h-[48px] py-3 font-semibold rounded-xl text-base flex justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Spinning up Next Question...
                </span>
              ) : (
                'Generate Next Question →'
              )}
            </button>
            <button
              onClick={reset}
              className="btn-secondary flex-1 min-h-[48px] py-3 rounded-xl text-base bg-slate-100 hover:bg-slate-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
