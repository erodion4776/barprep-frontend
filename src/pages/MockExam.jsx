import {
  useState, useEffect, useRef,
  useCallback, useMemo,
} from 'react'
import { Link }                from 'react-router-dom'
import { apiClient, supabase } from '../api/client'
import LoadingSpinner          from '../components/LoadingSpinner'
import ReactMarkdown           from 'react-markdown'
import { useProgress }         from '../context/ProgressContext'
import { BAR_TOPICS }          from '../context/ProgressContext'

// ── Helpers ───────────────────────────────────────────────────────────────────
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
      isCorrect:  attempt.is_correct,
      score:      attempt.score ?? (attempt.is_correct ? 100 : 0),
      timeTaken:  attempt.time_taken ?? 0,
    }
  }
  const isCorrect = legacyGrade(attempt.feedback || '', attempt.answer)
  return { isCorrect, score: isCorrect ? 100 : 0, timeTaken: attempt.time_taken ?? 0 }
}

const stripLegacyMarker = (text = '') =>
  text.replace(/<!-- grading: \{.*?\} -->\s*/g, '').trim()

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ value, color = 'bg-blue-500' }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`${color} h-1.5 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MockExam() {
  const { progress, loadProgress } = useProgress()

  // ── Phase & question state ─────────────────────────────────────────────────
  const [phase,         setPhase]         = useState('select')
  const [topic,         setTopic]         = useState(BAR_TOPICS[0])
  const [question,      setQuestion]      = useState('')
  const [answer,        setAnswer]        = useState('')
  const [feedback,      setFeedback]      = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [sessionCount,  setSessionCount]  = useState(0)

  // ── Grading state ──────────────────────────────────────────────────────────
  const [correctLetter,    setCorrectLetter]    = useState(null)
  const [rationale,        setRationale]        = useState('')
  const [lastIsCorrect,    setLastIsCorrect]    = useState(null)
  const [lastCorrectLetter, setLastCorrectLetter] = useState(null)
  const [finalTimeTaken,   setFinalTimeTaken]   = useState(0)

  // ── Timer state ────────────────────────────────────────────────────────────
  const [timeMode,      setTimeMode]      = useState('countdown')
  const [secondsLeft,   setSecondsLeft]   = useState(108)
  const [secondsSpent,  setSecondsSpent]  = useState(0)
  const [timerActive,   setTimerActive]   = useState(false)

  // ── History state ──────────────────────────────────────────────────────────
  const [history,        setHistory]        = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyLimit,   setHistoryLimit]   = useState(5)

  const timerRef = useRef(null)

  // ── Auto-select recommended topic ─────────────────────────────────────────
  useEffect(() => {
    if (progress.recommendedTopics?.length > 0) {
      setTopic(progress.recommendedTopics[0])
    }
  }, [progress.recommendedTopics])

  // ── Load history on mount ──────────────────────────────────────────────────
  useEffect(() => { loadHistory() }, [])

  // ── Keyboard shortcuts for A/B/C/D ────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'question') return
    const handler = (e) => {
      const key = e.key.toUpperCase()
      if (['A', 'B', 'C', 'D'].includes(key) &&
          !e.ctrlKey && !e.metaKey && !e.altKey) {
        setAnswer(key)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase])

  // ── Pause timer on tab switch ──────────────────────────────────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setTimerActive(false)
      else if (phase === 'question') setTimerActive(true)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [phase])

  // ── Timer tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (phase !== 'question' || !timerActive) return

    timerRef.current = setInterval(() => {
      setSecondsSpent(p => p + 1)
      if (timeMode === 'countdown') {
        setSecondsLeft(p => Math.max(0, p - 1))
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, timerActive, timeMode])

  // ── Load history ───────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error: dbErr } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (dbErr) throw dbErr
      setHistory(data || [])
    } catch (err) {
      console.error('Error loading history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // ── Derived stats — read from ProgressContext (single source of truth) ─────
  const stats = progress.stats
  const topicPerf = stats.topicPerformance

  const testedTopics   = useMemo(() =>
    Object.entries(topicPerf).filter(([, i]) => i.attempts > 0),
    [topicPerf]
  )
  const strongestAreas = useMemo(() =>
    testedTopics
      .filter(([, i]) => i.accuracy >= 75)
      .map(([name, i]) => ({ name, ...i }))
      .sort((a, b) => b.accuracy - a.accuracy),
    [testedTopics]
  )
  const improvingAreas = useMemo(() =>
    testedTopics
      .filter(([, i]) => i.accuracy >= 50 && i.accuracy < 75)
      .map(([name, i]) => ({ name, ...i }))
      .sort((a, b) => b.accuracy - a.accuracy),
    [testedTopics]
  )
  const focusAreas = useMemo(() =>
    Object.entries(topicPerf)
      .filter(([, i]) => i.attempts === 0 || i.accuracy < 50)
      .map(([name, i]) => ({ name, ...i }))
      .sort((a, b) => a.attempts - b.attempts || a.accuracy - b.accuracy),
    [topicPerf]
  )

  const currentTopicPerf = topicPerf[topic]
  const isCurrentWeak    = progress.weakTopics?.includes(topic)
  const isCurrentStrong  = progress.strongTopics?.includes(topic)

  // ── Generate question ──────────────────────────────────────────────────────
  const generateQuestion = useCallback(async (selectedTopic) => {
    const topicToUse = selectedTopic || topic
    setLoading(true)
    setError('')
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
      setSessionCount(c => c + 1)
    } catch (err) {
      setError(err.message || 'Failed to generate question.')
      setPhase('select')
    } finally {
      setLoading(false)
    }
  }, [topic])

  // ── Submit answer ──────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async () => {
    if (!answer || !question || !correctLetter) return
    setLoading(true)
    setError('')
    setTimerActive(false)
    const finalTime = secondsSpent

    try {
      const res = await apiClient.evaluateAnswer(
        question, answer, correctLetter, rationale
      )
      const { reply: fb, is_correct, correct_letter } = res.data || {}
      if (!fb) {
        setError('Failed to evaluate answer. Please try again.')
        return
      }

      setFinalTimeTaken(finalTime)
      setLastIsCorrect(is_correct)
      setLastCorrectLetter(correct_letter)
      setFeedback(fb)
      setPhase('feedback')

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('attempts').insert({
          user_id:        user.id,
          question,
          answer,
          feedback:       fb,
          topic,
          is_correct,
          score:          is_correct ? 100 : 0,
          time_taken:     finalTime,
          correct_letter,
        })
        await Promise.all([loadHistory(), loadProgress()])
      }
    } catch (err) {
      setError(err.message || 'Failed to evaluate answer.')
    } finally {
      setLoading(false)
    }
  }, [answer, question, correctLetter, rationale, topic,
      secondsSpent, loadHistory, loadProgress])

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setQuestion(''); setAnswer(''); setFeedback('')
    setError(''); setTimerActive(false)
    setCorrectLetter(null); setRationale('')
    setLastIsCorrect(null); setLastCorrectLetter(null)
    setPhase('select')
  }, [])

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Mock Exam & Analytics
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Practice with real-time pacing feedback, grading logs,
            and topic diagnostics.
          </p>
          {sessionCount > 0 && (
            <p className="text-xs text-blue-600 font-medium mt-1">
              🔥 {sessionCount} question{sessionCount !== 1 ? 's' : ''} this session
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/chat"
            className="text-xs px-3 py-1.5 rounded-full border border-slate-200
                       text-slate-600 hover:border-blue-300 hover:text-blue-600
                       transition-colors font-medium"
          >
            🤖 AI Coach
          </Link>
          <Link
            to="/tutorials"
            className="text-xs px-3 py-1.5 rounded-full border border-slate-200
                       text-slate-600 hover:border-blue-300 hover:text-blue-600
                       transition-colors font-medium"
          >
            🎥 Tutorials
          </Link>
          <Link
            to="/blog"
            className="text-xs px-3 py-1.5 rounded-full border border-slate-200
                       text-slate-600 hover:border-blue-300 hover:text-blue-600
                       transition-colors font-medium"
          >
            📰 Blog
          </Link>
          {phase === 'select' && (
            <button
              onClick={() => { loadHistory(); loadProgress() }}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200
                         text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              🔄 Refresh
            </button>
          )}
        </div>
      </div>

      {/* ── AI Recommendation Banner ── */}
      {phase === 'select' && progress.recommendedTopics?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4
                        flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-900">
              🎯 AI Recommends These Topics
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Based on your history, these need the most attention
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {progress.recommendedTopics.map(t => (
              <button
                key={t}
                onClick={() => { setTopic(t); generateQuestion(t) }}
                className="text-xs bg-blue-600 text-white px-3 py-1.5
                           rounded-full hover:bg-blue-700 transition-colors
                           font-medium"
              >
                {t} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl
                        text-red-700 text-sm flex items-center justify-between">
          <span>❌ {error}</span>
          <button
            onClick={() => setError('')}
            className="underline text-xs font-semibold hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PHASE: SELECT
      ══════════════════════════════════════════ */}
      {phase === 'select' && (
        <div className="space-y-8">

          {/* Stats cards */}
          {stats.totalAttempts > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                {
                  label: 'Questions',
                  value: stats.totalAttempts,
                  sub:   'Total answered',
                  color: 'text-slate-900',
                },
                {
                  label: 'Accuracy',
                  value: `${stats.overallAccuracy}%`,
                  sub:   `${stats.totalCorrect} correct`,
                  color: 'text-blue-600',
                },
                {
                  label: 'Avg Time',
                  value: stats.averageTime > 0 ? formatTime(stats.averageTime) : 'N/A',
                  sub:   stats.averageTime > 108
                    ? '⚠️ Over pace limit'
                    : '✅ Good pacing',
                  color: 'text-indigo-600',
                },
                {
                  label: 'Streak',
                  value: `${stats.currentStreak ?? 0}🔥`,
                  sub:   `Best: ${stats.longestStreak ?? 0} days`,
                  color: 'text-orange-500',
                },
              ].map(({ label, value, sub, color }) => (
                <div key={label}
                     className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-slate-400 text-xs font-semibold
                                  uppercase tracking-wider">
                    {label}
                  </div>
                  <div className={`text-3xl font-extrabold mt-2 ${color}`}>
                    {value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Topic performance report */}
          {stats.totalAttempts > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl
                            p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Topic Performance Report
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Diagnostic based on your historical mock exam scoring.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Strongest */}
                <div className="bg-white p-4 rounded-xl border border-green-100 space-y-3">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider">
                    🏆 Strongest (≥75%)
                  </h3>
                  {strongestAreas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No areas in master zone yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {strongestAreas.map(item => (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs
                                          font-medium text-slate-800">
                            <span>{item.name}</span>
                            <span className="text-green-600">
                              {item.accuracy}%
                            </span>
                          </div>
                          <ScoreBar value={item.accuracy} color="bg-green-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Improving */}
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    📈 Improving (50–74%)
                  </h3>
                  {improvingAreas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No topics in intermediate zone.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {improvingAreas.map(item => (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs
                                          font-medium text-slate-800">
                            <span>{item.name}</span>
                            <span className="text-blue-600">
                              {item.accuracy}%
                            </span>
                          </div>
                          <ScoreBar value={item.accuracy} color="bg-blue-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Focus */}
                <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-3">
                  <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    ⚠️ Focus (&lt;50% / untested)
                  </h3>
                  {focusAreas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      All topics in good shape!
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {focusAreas.slice(0, 6).map(item => (
                        <div
                          key={item.name}
                          className="flex justify-between items-center text-xs
                                     text-slate-700 py-1 border-b border-slate-50
                                     last:border-0"
                        >
                          <button
                            onClick={() => setTopic(item.name)}
                            className="font-medium hover:text-blue-600
                                       transition-colors text-left truncate max-w-[140px]"
                          >
                            {item.name}
                          </button>
                          <span className="text-slate-400 shrink-0">
                            {item.attempts > 0
                              ? `${item.accuracy}%`
                              : 'Untested'
                            }
                          </span>
                        </div>
                      ))}
                      {focusAreas.length > 6 && (
                        <p className="text-[10px] text-slate-400 text-center pt-1">
                          +{focusAreas.length - 6} more to practice
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Weak topic tutorial links */}
              {progress.weakTopics?.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                    📚 Study resources for weak topics:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {progress.weakTopics.slice(0, 4).map(t => (
                      <Link
                        key={t}
                        to="/tutorials"
                        className="text-xs bg-white border border-amber-200
                                   text-amber-700 px-3 py-1 rounded-full
                                   hover:bg-amber-50 transition-colors font-medium"
                      >
                        🎥 {t}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Topic selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Choose Practice Topic
              </h2>
              <span className="text-xs text-slate-400">
                Press A/B/C/D to answer quickly
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {BAR_TOPICS.map(t => {
                const perf          = topicPerf[t]
                const isWeak        = progress.weakTopics?.includes(t)
                const isStrong      = progress.strongTopics?.includes(t)
                const isRecommended = progress.recommendedTopics?.includes(t)

                return (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`
                      p-3.5 rounded-xl text-sm font-semibold text-left
                      transition-all duration-200 border flex flex-col
                      justify-between min-h-[72px]
                      ${topic === t
                        ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-300'
                        : isWeak
                          ? 'bg-amber-50 border-amber-200 text-slate-700 hover:border-amber-400'
                          : isStrong
                            ? 'bg-green-50 border-green-200 text-slate-700 hover:border-green-400'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{t}</span>
                      <div className="flex items-center gap-1">
                        {isRecommended && (
                          <span className="text-[9px] bg-blue-600 text-white
                                           px-1.5 py-0.5 rounded-full font-bold">
                            AI Pick
                          </span>
                        )}
                        {isWeak && !isRecommended && (
                          <span className="text-[9px] text-amber-600 font-bold">⚠️</span>
                        )}
                        {isStrong && (
                          <span className="text-[9px] text-green-600 font-bold">✅</span>
                        )}
                      </div>
                    </div>
                    {perf?.attempts > 0 ? (
                      <span className={`text-[10px] mt-1 font-medium
                        ${isWeak ? 'text-amber-600' : isStrong ? 'text-green-600' : 'text-slate-400'}`}>
                        {perf.accuracy}% • {perf.attempts} attempts
                      </span>
                    ) : (
                      <span className="text-[10px] mt-1 text-slate-300">
                        Not practiced yet
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => generateQuestion(topic)}
              disabled={loading}
              className="w-full py-3 min-h-[48px] bg-blue-600 text-white
                         font-bold rounded-xl hover:bg-blue-700 transition-colors
                         disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><LoadingSpinner size="sm" color="white" /> Generating…</>
                : `Launch ${topic} Question →`
              }
            </button>
          </div>

          {/* Practice history */}
          {history.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Practice Log ({history.length} total)
                </h3>
                {loadingHistory && (
                  <LoadingSpinner size="sm" text="Updating…" />
                )}
              </div>

              <div className="space-y-3">
                {history.slice(0, historyLimit).map((attempt, i) => {
                  const g          = parseAttemptGrading(attempt)
                  const dotColor   = g.isCorrect === null
                    ? 'bg-slate-300'
                    : g.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  const badgeStyle = g.isCorrect === null
                    ? 'bg-slate-100 text-slate-600'
                    : g.isCorrect
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'

                  return (
                    <details
                      key={attempt.id || i}
                      className="group bg-white border border-slate-200
                                 hover:border-slate-300 rounded-xl overflow-hidden
                                 transition-all"
                    >
                      <summary className="flex items-center justify-between
                                          p-4 cursor-pointer select-none list-none">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`} />
                          <div>
                            <span className="text-sm font-semibold text-slate-900">
                              {attempt.topic || 'General'}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              Option {attempt.answer || 'N/A'} •{' '}
                              {attempt.created_at
                                ? new Date(attempt.created_at).toLocaleDateString()
                                : 'Just now'
                              }
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2.5 py-1
                                           rounded-full ${badgeStyle}`}>
                            {g.isCorrect === null
                              ? 'Ungraded'
                              : g.isCorrect ? 'Correct' : 'Incorrect'
                            }
                          </span>
                          {g.timeTaken > 0 && (
                            <span className="text-xs text-slate-500 font-mono">
                              ⏱ {formatTime(g.timeTaken)}
                            </span>
                          )}
                          <span className="text-slate-400 text-xs
                                           group-open:rotate-180 transition-transform">
                            ▼
                          </span>
                        </div>
                      </summary>

                      <div className="p-4 border-t border-slate-100 bg-slate-50
                                      space-y-4 text-sm text-slate-700">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">
                            Question
                          </h4>
                          <div className="bg-white p-3 rounded-lg border border-slate-200
                                          text-xs max-h-[150px] overflow-y-auto">
                            <ReactMarkdown>{attempt.question}</ReactMarkdown>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">
                            AI Feedback
                          </h4>
                          <div className="bg-white p-3 rounded-lg border border-slate-200
                                          text-xs prose prose-slate max-w-none">
                            <ReactMarkdown>
                              {stripLegacyMarker(attempt.feedback)}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTopic(attempt.topic)
                            generateQuestion(attempt.topic)
                          }}
                          className="text-xs bg-blue-50 border border-blue-200
                                     text-blue-700 px-3 py-1.5 rounded-full
                                     hover:bg-blue-100 transition-colors"
                        >
                          Practice {attempt.topic} Again →
                        </button>
                      </div>
                    </details>
                  )
                })}
              </div>

              {/* Load more */}
              {history.length > historyLimit && (
                <button
                  onClick={() => setHistoryLimit(l => l + 5)}
                  className="w-full py-2 text-sm text-slate-500
                             hover:text-slate-700 border border-slate-200
                             rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Load more ({history.length - historyLimit} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          PHASE: QUESTION
      ══════════════════════════════════════════ */}
      {phase === 'question' && question && (
        <div className="bg-white border border-slate-200 rounded-2xl
                        p-6 space-y-6">

          {/* Topic + timer */}
          <div className="flex items-center justify-between flex-wrap gap-3
                          border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1 bg-blue-100
                               text-blue-700 rounded-full">
                {topic}
              </span>
              {isCurrentWeak && (
                <span className="text-xs font-bold px-2 py-1 bg-amber-100
                                 text-amber-700 rounded-full">
                  ⚠️ Focus Area
                </span>
              )}
              {isCurrentStrong && (
                <span className="text-xs font-bold px-2 py-1 bg-green-100
                                 text-green-700 rounded-full">
                  ✅ Strong Area
                </span>
              )}
              <span className="text-slate-400 text-xs">
                Q#{sessionCount}
              </span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5
                            rounded-xl border border-slate-200">
              <button
                onClick={() => setTimeMode(m => m === 'countdown' ? 'stopwatch' : 'countdown')}
                className="text-xs text-blue-600 hover:text-blue-800 underline
                           font-semibold transition-colors"
              >
                {timeMode === 'countdown' ? 'MBE Pace' : 'Stopwatch'}
              </button>
              <span className={`text-base font-mono font-bold
                ${timeMode === 'countdown' && secondsLeft <= 20
                  ? 'text-red-500 animate-pulse'
                  : timeMode === 'countdown' && secondsLeft <= 45
                    ? 'text-amber-500'
                    : 'text-slate-700'
                }`}>
                ⏱ {timeMode === 'countdown'
                  ? formatTime(secondsLeft)
                  : formatTime(secondsSpent)
                }
              </span>
            </div>
          </div>

          {/* Question text */}
          <div className="prose prose-slate max-w-none text-slate-800 text-sm
                          leading-relaxed bg-slate-50 p-4 rounded-xl
                          border border-slate-100">
            <ReactMarkdown>{question}</ReactMarkdown>
          </div>

          {/* Answer choices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Select your answer: <span className="font-normal normal-case text-slate-300">
                  (or press A / B / C / D)
                </span>
              </p>
              {timeMode === 'countdown' && secondsLeft === 0 && (
                <span className="text-xs font-semibold text-red-500">
                  ⏱ Time's up — make your best guess!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['A', 'B', 'C', 'D'].map(letter => (
                <button
                  key={letter}
                  onClick={() => setAnswer(letter)}
                  className={`
                    p-3.5 rounded-xl text-sm font-semibold border-2
                    transition-all duration-200 min-h-[52px]
                    flex items-center gap-3
                    ${answer === letter
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                    }
                  `}
                >
                  <span className={`
                    w-8 h-8 rounded-full border-2 flex items-center
                    justify-center text-xs font-bold shrink-0
                    ${answer === letter
                      ? 'border-white bg-white text-blue-600'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                    }
                  `}>
                    {letter}
                  </span>
                  Option {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={submitAnswer}
              disabled={!answer || loading}
              className="flex-1 py-3 min-h-[48px] bg-blue-600 text-white
                         font-bold rounded-xl hover:bg-blue-700 transition-colors
                         disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><LoadingSpinner size="sm" color="white" /> Grading…</>
                : answer ? `Grade Answer ${answer} →` : 'Select an Answer'
              }
            </button>
            <button
              onClick={reset}
              disabled={loading}
              className="px-5 py-3 border border-slate-200 text-slate-600
                         rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              Abandon
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PHASE: FEEDBACK
      ══════════════════════════════════════════ */}
      {phase === 'feedback' && feedback && (
        <div className="space-y-6">

          {/* Result banner */}
          <div className={`p-6 rounded-2xl border-2 flex flex-col sm:flex-row
            sm:items-center sm:justify-between gap-6
            ${lastIsCorrect
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200'
            }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold
                  text-white uppercase
                  ${lastIsCorrect ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {lastIsCorrect ? 'Correct' : 'Incorrect'}
                </span>
                <span className="text-slate-400 text-xs">{topic}</span>
                <span className="text-slate-400 text-xs">Q#{sessionCount}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 pt-1">
                {lastIsCorrect ? 'Superb! Spot On.' : 'Not quite right.'}
              </h2>
              <p className="text-slate-600 text-xs">
                You selected <strong>{answer}</strong>.
                {!lastIsCorrect && lastCorrectLetter && (
                  <> Correct answer was <strong>{lastCorrectLetter}</strong>.</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0
                            sm:border-l border-slate-200/50 pt-4 sm:pt-0 sm:pl-6 shrink-0">
              <div className="text-center">
                <div className={`text-3xl font-black font-mono
                  ${lastIsCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {lastIsCorrect ? '100' : '0'}%
                </div>
                <div className="text-[10px] text-slate-400 uppercase">Score</div>
              </div>
              <div className="w-px h-10 bg-slate-200/50" />
              <div className="text-center">
                <div className="text-3xl font-black font-mono text-slate-700">
                  {formatTime(finalTimeTaken)}
                </div>
                <div className="text-[10px] text-slate-400 uppercase">Time</div>
              </div>
            </div>
          </div>

          {/* Detailed feedback */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase pb-3
                           border-b border-slate-100 mb-4">
              ⚖️ Explanation & Rationale
            </h3>
            <div className="prose prose-slate max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{stripLegacyMarker(feedback)}</ReactMarkdown>
            </div>
          </div>

          {/* Post-answer smart links */}
          {!lastIsCorrect ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl
                            p-4 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">
                  Strengthen your {topic} knowledge
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Link
                    to="/tutorials"
                    className="text-xs bg-amber-600 text-white px-3 py-1.5
                               rounded-full hover:bg-amber-700 transition-colors"
                  >
                    🎥 Watch Tutorial →
                  </Link>
                  <Link
                    to="/chat"
                    className="text-xs border border-amber-300 text-amber-800
                               px-3 py-1.5 rounded-full hover:bg-amber-50 transition-colors"
                  >
                    🤖 Ask AI Coach →
                  </Link>
                  <Link
                    to="/blog"
                    className="text-xs border border-amber-300 text-amber-800
                               px-3 py-1.5 rounded-full hover:bg-amber-50 transition-colors"
                  >
                    📰 Read Blog Tips →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl
                            p-4 flex items-start gap-3">
              <span className="text-xl">🎉</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-900">
                  Great work on {topic}!
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {progress.weakTopics?.length > 0
                    ? `Consider practicing ${progress.weakTopics[0]} next.`
                    : 'Keep the momentum going!'
                  }
                </p>
                {progress.weakTopics?.length > 0 && (
                  <button
                    onClick={() => {
                      setTopic(progress.weakTopics[0])
                      generateQuestion(progress.weakTopics[0])
                    }}
                    className="mt-2 text-xs bg-emerald-600 text-white
                               px-3 py-1.5 rounded-full hover:bg-emerald-700
                               transition-colors"
                  >
                    Practice {progress.weakTopics[0]} →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => generateQuestion(topic)}
              disabled={loading}
              className="flex-1 py-3 min-h-[48px] bg-blue-600 text-white
                         font-bold rounded-xl hover:bg-blue-700 transition-colors
                         disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><LoadingSpinner size="sm" color="white" /> Generating…</>
                : 'Next Question →'
              }
            </button>
            <button
              onClick={reset}
              className="flex-1 py-3 border border-slate-200 text-slate-600
                         rounded-xl hover:bg-slate-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
