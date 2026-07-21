import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../api/client'

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState({
    attempts: [],
    stats: {
      totalAttempts: 0,
      totalCorrect: 0,
      averageTime: 0,
      topicPerformance: {},
      overallAccuracy: 0,
    },
    watchedModules: [],
    weakTopics: [],
    strongTopics: [],
    recommendedTopics: [],
    loading: true,
  })

  const TOPICS = [
    'Constitutional Law', 'Contracts', 'Torts', 'Criminal Law',
    'Civil Procedure', 'Evidence', 'Real Property',
    'Business Associations', 'Family Law', 'Wills & Trusts',
  ]

  const loadProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProgress(prev => ({ ...prev, loading: false }))
        return
      }

      // Load exam attempts
      const { data: attempts } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Load watched/visited modules from localStorage
      const watched = JSON.parse(
        localStorage.getItem(`watched_modules_${user.id}`) || '[]'
      )

      // Calculate stats
      const topicPerf = {}
      TOPICS.forEach(t => {
        topicPerf[t] = { attempts: 0, correct: 0, accuracy: 0, totalTime: 0 }
      })

      let totalCorrect = 0
      let totalTime = 0
      let timedCount = 0
      let gradedCount = 0

      ;(attempts || []).forEach(attempt => {
        const isCorrect = attempt.is_correct
        if (isCorrect === null || isCorrect === undefined) return

        gradedCount++
        if (isCorrect) totalCorrect++
        if (attempt.time_taken > 0) {
          totalTime += attempt.time_taken
          timedCount++
        }

        const t = attempt.topic || 'General'
        if (!topicPerf[t]) {
          topicPerf[t] = { attempts: 0, correct: 0, accuracy: 0, totalTime: 0 }
        }
        topicPerf[t].attempts++
        if (isCorrect) topicPerf[t].correct++
        if (attempt.time_taken > 0) topicPerf[t].totalTime += attempt.time_taken
      })

      // Calculate accuracy per topic
      Object.keys(topicPerf).forEach(t => {
        const item = topicPerf[t]
        if (item.attempts > 0) {
          item.accuracy = Math.round((item.correct / item.attempts) * 100)
          item.avgTime = Math.round(item.totalTime / item.attempts)
        }
      })

      const overallAccuracy = gradedCount > 0
        ? Math.round((totalCorrect / gradedCount) * 100)
        : 0

      // Classify topics
      const weakTopics = TOPICS.filter(t =>
        topicPerf[t]?.attempts === 0 || topicPerf[t]?.accuracy < 50
      )
      const strongTopics = TOPICS.filter(t =>
        topicPerf[t]?.attempts > 0 && topicPerf[t]?.accuracy >= 75
      )

      // Recommend weak topics first, then untested
      const recommendedTopics = [
        ...TOPICS.filter(t => topicPerf[t]?.attempts > 0 && topicPerf[t]?.accuracy < 50),
        ...TOPICS.filter(t => topicPerf[t]?.attempts === 0),
        ...TOPICS.filter(t => topicPerf[t]?.attempts > 0 && topicPerf[t]?.accuracy >= 50 && topicPerf[t]?.accuracy < 75),
      ].slice(0, 3)

      setProgress({
        attempts: attempts || [],
        stats: {
          totalAttempts: gradedCount,
          totalCorrect,
          averageTime: timedCount > 0 ? Math.round(totalTime / timedCount) : 0,
          topicPerformance: topicPerf,
          overallAccuracy,
        },
        watchedModules: watched,
        weakTopics,
        strongTopics,
        recommendedTopics,
        loading: false,
        userId: user.id,
      })
    } catch (err) {
      console.error('Progress load error:', err)
      setProgress(prev => ({ ...prev, loading: false }))
    }
  }, [])

  // Mark a module as watched
  const markModuleWatched = useCallback(async (moduleId, moduleTitle, moduleTopic) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const key = `watched_modules_${user.id}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const already = existing.find(m => m.id === moduleId)
    if (!already) {
      const updated = [
        { id: moduleId, title: moduleTitle, topic: moduleTopic, watchedAt: new Date().toISOString() },
        ...existing,
      ]
      localStorage.setItem(key, JSON.stringify(updated))
      setProgress(prev => ({ ...prev, watchedModules: updated }))
    }
  }, [])

  // Build a progress summary string for the AI
  const getProgressSummary = useCallback(() => {
    const { stats, weakTopics, strongTopics, watchedModules, attempts } = progress

    if (stats.totalAttempts === 0 && watchedModules.length === 0) {
      return 'This student is brand new — no exam attempts or tutorials watched yet. Start with fundamentals.'
    }

    const recentAttempts = attempts.slice(0, 5).map(a =>
      `${a.topic}: ${a.is_correct ? 'correct' : 'incorrect'} (${a.answer})`
    ).join(', ')

    const topicDetails = Object.entries(stats.topicPerformance)
      .filter(([, info]) => info.attempts > 0)
      .map(([topic, info]) => `${topic}: ${info.accuracy}% (${info.correct}/${info.attempts})`)
      .join(', ')

    return `
STUDENT PROGRESS REPORT:
- Overall Accuracy: ${stats.overallAccuracy}% (${stats.totalCorrect}/${stats.totalAttempts} questions correct)
- Average Response Time: ${stats.averageTime}s per question
- Strong Topics (≥75%): ${strongTopics.length > 0 ? strongTopics.join(', ') : 'None yet'}
- Weak Topics (<50%): ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None identified yet'}
- Topic Breakdown: ${topicDetails || 'No attempts yet'}
- Recent Attempts: ${recentAttempts || 'None'}
- Tutorials Watched: ${watchedModules.length > 0 ? watchedModules.map(m => m.title).join(', ') : 'None yet'}
    `.trim()
  }, [progress])

  useEffect(() => {
    loadProgress()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProgress()
    })
    return () => subscription?.unsubscribe()
  }, [loadProgress])

  return (
    <ProgressContext.Provider value={{ progress, loadProgress, markModuleWatched, getProgressSummary }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}
