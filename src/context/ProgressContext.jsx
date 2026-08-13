import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef
} from 'react'
import { supabase } from '../api/client'

// ── Constants ─────────────────────────────────────────────────────────────────
export const BAR_TOPICS = [
  'Constitutional Law', 'Contracts',   'Torts',
  'Criminal Law',       'Civil Procedure', 'Evidence',
  'Real Property',      'Business Associations',
  'Family Law',         'Wills & Trusts',
]

const DEFAULT_TOPIC_PERF = () =>
  Object.fromEntries(
    BAR_TOPICS.map(t => [t, { attempts: 0, correct: 0, accuracy: 0, totalTime: 0, avgTime: 0 }])
  )

const DEFAULT_PROGRESS = {
  attempts:           [],
  stats: {
    totalAttempts:    0,
    totalCorrect:     0,
    averageTime:      0,
    topicPerformance: DEFAULT_TOPIC_PERF(),
    overallAccuracy:  0,
    todayAttempts:    0,
    todayCorrect:     0,
    currentStreak:    0,
    longestStreak:    0,
  },
  watchedModules:     [],
  weakTopics:         [],
  strongTopics:       [],
  recommendedTopics:  [],
  loading:            true,
  error:              null,
  userId:             null,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcStreak(attempts) {
  if (!attempts.length) return { current: 0, longest: 0 }

  // Group by date
  const byDate = {}
  attempts.forEach(a => {
    if (a.is_correct === null || a.is_correct === undefined) return
    const date = new Date(a.created_at).toDateString()
    if (!byDate[date]) byDate[date] = { correct: 0, total: 0 }
    byDate[date].total++
    if (a.is_correct) byDate[date].correct++
  })

  const dates = Object.keys(byDate).sort(
    (a, b) => new Date(b) - new Date(a)
  )

  let current = 0
  let longest = 0
  let streak  = 0
  const today     = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // Current streak — must include today or yesterday
  if (dates[0] === today || dates[0] === yesterday) {
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(
        Date.now() - i * 86400000
      ).toDateString()
      if (dates[i] === expected) {
        streak++
      } else {
        break
      }
    }
    current = streak
  }

  // Longest streak
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    const diff =
      (new Date(dates[i - 1]) - new Date(dates[i])) / 86400000
    if (diff === 1) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }
  longest = Math.max(longest, current)

  return { current, longest }
}

function isToday(dateStr) {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

// ── Context ───────────────────────────────────────────────────────────────────
const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(DEFAULT_PROGRESS)
  const realtimeRef = useRef(null)

  // ── Load progress ───────────────────────────────────────────────────────────
  const loadProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProgress({ ...DEFAULT_PROGRESS, loading: false })
        return
      }

      // Parallel fetch: attempts + watched modules
      const [attemptsRes, watchedRes] = await Promise.all([
        supabase
          .from('attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('watched_modules')
          .select('*')
          .eq('user_id', user.id)
          .order('watched_at', { ascending: false }),
      ])

      const attempts = attemptsRes.data || []
      const watched  = watchedRes.data  || []

      // ── Calculate topic performance ───────────────────────────────────────
      const topicPerf = DEFAULT_TOPIC_PERF()
      let totalCorrect = 0
      let totalTime    = 0
      let timedCount   = 0
      let gradedCount  = 0
      let todayAttempts = 0
      let todayCorrect  = 0

      attempts.forEach(attempt => {
        const { is_correct, time_taken, topic, created_at } = attempt
        if (is_correct === null || is_correct === undefined) return

        gradedCount++
        if (is_correct) totalCorrect++
        if (time_taken > 0) { totalTime += time_taken; timedCount++ }
        if (isToday(created_at)) {
          todayAttempts++
          if (is_correct) todayCorrect++
        }

        const t = topic || 'General'
        if (!topicPerf[t]) {
          topicPerf[t] = { attempts: 0, correct: 0, accuracy: 0, totalTime: 0, avgTime: 0 }
        }
        topicPerf[t].attempts++
        if (is_correct) topicPerf[t].correct++
        if (time_taken > 0) topicPerf[t].totalTime += time_taken
      })

      Object.keys(topicPerf).forEach(t => {
        const item = topicPerf[t]
        if (item.attempts > 0) {
          item.accuracy = Math.round((item.correct / item.attempts) * 100)
          item.avgTime  = Math.round(item.totalTime / item.attempts)
        }
      })

      const overallAccuracy = gradedCount > 0
        ? Math.round((totalCorrect / gradedCount) * 100)
        : 0

      // ── Streaks ───────────────────────────────────────────────────────────
      const { current: currentStreak, longest: longestStreak } =
        calcStreak(attempts)

      // ── Topic classification ──────────────────────────────────────────────
      const weakTopics   = BAR_TOPICS.filter(t =>
        topicPerf[t]?.attempts === 0 || topicPerf[t]?.accuracy < 50
      )
      const strongTopics = BAR_TOPICS.filter(t =>
        topicPerf[t]?.attempts > 0 && topicPerf[t]?.accuracy >= 75
      )
      const recommendedTopics = [
        ...BAR_TOPICS.filter(t => topicPerf[t]?.attempts > 0 && topicPerf[t]?.accuracy < 50),
        ...BAR_TOPICS.filter(t => topicPerf[t]?.attempts === 0),
        ...BAR_TOPICS.filter(t => {
          const a = topicPerf[t]?.accuracy
          return topicPerf[t]?.attempts > 0 && a >= 50 && a < 75
        }),
      ].slice(0, 3)

      setProgress({
        attempts,
        stats: {
          totalAttempts:    gradedCount,
          totalCorrect,
          averageTime:      timedCount > 0 ? Math.round(totalTime / timedCount) : 0,
          topicPerformance: topicPerf,
          overallAccuracy,
          todayAttempts,
          todayCorrect,
          currentStreak,
          longestStreak,
        },
        watchedModules:    watched,
        weakTopics,
        strongTopics,
        recommendedTopics,
        loading:           false,
        error:             null,
        userId:            user.id,
      })

      // ── Realtime: live attempt updates ────────────────────────────────────
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current)
      }
      realtimeRef.current = supabase
        .channel(`attempts:${user.id}`)
        .on(
          'postgres_changes',
          {
            event:  '*',
            schema: 'public',
            table:  'attempts',
            filter: `user_id=eq.${user.id}`,
          },
          () => loadProgress() // re-fetch on any change
        )
        .subscribe()

    } catch (err) {
      console.error('Progress load error:', err)
      setProgress(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load progress. Please refresh.',
      }))
    }
  }, [])

  // ── Mark module watched (Supabase + local) ──────────────────────────────────
  const markModuleWatched = useCallback(async (moduleId, moduleTitle, moduleTopic) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if already watched
    const already = progress.watchedModules.find(m => m.module_id === moduleId)
    if (already) return

    const entry = {
      user_id:    user.id,
      module_id:  moduleId,
      title:      moduleTitle,
      topic:      moduleTopic,
      watched_at: new Date().toISOString(),
    }

    // Optimistic update
    setProgress(prev => ({
      ...prev,
      watchedModules: [entry, ...prev.watchedModules],
    }))

    // Persist to Supabase
    try {
      await supabase
        .from('watched_modules')
        .upsert(entry, { onConflict: 'user_id,module_id' })
    } catch (err) {
      console.warn('Failed to sync watched module:', err)
    }
  }, [progress.watchedModules])

  // ── Progress summary for AI ─────────────────────────────────────────────────
  const getProgressSummary = useCallback(() => {
    const {
      stats,
      weakTopics,
      strongTopics,
      watchedModules,
      attempts,
    } = progress

    if (stats.totalAttempts === 0 && watchedModules.length === 0) {
      return 'This student is brand new — no exam attempts or tutorials watched yet. Start with fundamentals.'
    }

    const recentAttempts = attempts.slice(0, 5).map(a =>
      `${a.topic}: ${a.is_correct ? 'correct' : 'incorrect'} (${a.answer})`
    ).join(', ')

    const topicDetails = Object.entries(stats.topicPerformance)
      .filter(([, info]) => info.attempts > 0)
      .map(([topic, info]) =>
        `${topic}: ${info.accuracy}% (${info.correct}/${info.attempts})`
      )
      .join(', ')

    return `
STUDENT PROGRESS REPORT:
- Overall Accuracy: ${stats.overallAccuracy}% (${stats.totalCorrect}/${stats.totalAttempts})
- Today: ${stats.todayCorrect}/${stats.todayAttempts} correct
- Current Streak: ${stats.currentStreak} day(s) | Longest: ${stats.longestStreak} day(s)
- Avg Response Time: ${stats.averageTime}s per question
- Strong Topics (≥75%): ${strongTopics.join(', ') || 'None yet'}
- Weak Topics (<50%):   ${weakTopics.join(', ')   || 'None identified yet'}
- Topic Breakdown: ${topicDetails || 'No attempts yet'}
- Recent Attempts: ${recentAttempts || 'None'}
- Tutorials Watched: ${watchedModules.map(m => m.title).join(', ') || 'None yet'}
    `.trim()
  }, [progress])

  // ── Auth listener ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadProgress()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        // Only reload on actual sign in/out, not token refresh
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          loadProgress()
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current)
      }
    }
  }, [loadProgress])

  return (
    <ProgressContext.Provider
      value={{
        progress,
        loadProgress,
        markModuleWatched,
        getProgressSummary,
        BAR_TOPICS,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}
