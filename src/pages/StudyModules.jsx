import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link }                from 'react-router-dom'
import { apiClient, supabase } from '../api/client'
import LoadingSpinner          from '../components/LoadingSpinner'
import { useProgress }         from '../context/ProgressContext'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOPICS = [
  'Constitutional Law', 'Contracts',    'Torts',
  'Criminal Law',       'Civil Procedure', 'Evidence',
  'Real Property',      'Business Associations',
  'Family Law',         'Wills & Trusts',
]

const ASSIGNMENT_TYPES = [
  { value: 'essay',    label: '📝 Essay Answer'      },
  { value: 'memo',     label: '📄 Legal Memo'        },
  { value: 'brief',    label: '⚖️ Case Brief'        },
  { value: 'outline',  label: '📋 Topic Outline'     },
  { value: 'practice', label: '✍️ Practice Question' },
]

const TABS = [
  { id: 'planner',    label: '📅 Study Planner' },
  { id: 'assignment', label: '📝 Assignment'    },
]

const FOCUS_COLORS = {
  weak:       'border-l-red-500    bg-red-50',
  strong:     'border-l-green-500  bg-green-50',
  review:     'border-l-amber-500  bg-amber-50',
  'exam-sim': 'border-l-purple-500 bg-purple-50',
  mixed:      'border-l-blue-500   bg-blue-50',
}

// ── JSON parse helpers ────────────────────────────────────────────────────────
function safeParseJSON(raw) {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response.')
  try {
    return JSON.parse(match[0])
  } catch {
    const cleaned = match[0]
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/[\u0000-\u001F]/g, ' ')
      .replace(/\t/g, ' ')
    return JSON.parse(cleaned)
  }
}

// ── Grade helpers ─────────────────────────────────────────────────────────────
const GRADE_COLORS = {
  A: 'text-green-600', B: 'text-blue-600',
  C: 'text-amber-600', D: 'text-orange-600',
  F: 'text-red-600',
}
const GRADE_BG = {
  A: 'bg-green-50 border-green-200',
  B: 'bg-blue-50 border-blue-200',
  C: 'bg-amber-50 border-amber-200',
  D: 'bg-orange-50 border-orange-200',
  F: 'bg-red-50 border-red-200',
}
const READINESS = {
  'not-ready':    { label: 'Not Ready',     color: 'bg-red-100 text-red-700'     },
  'developing':   { label: 'Developing',    color: 'bg-amber-100 text-amber-700' },
  'almost-ready': { label: 'Almost Ready',  color: 'bg-blue-100 text-blue-700'   },
  'ready':        { label: 'Bar Ready! 🎉', color: 'bg-green-100 text-green-700' },
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
      <div
        className={`h-2 rounded-full transition-all duration-500
          ${score >= 80 ? 'bg-green-500'
            : score >= 60 ? 'bg-blue-500'
            : 'bg-amber-500'
          }`}
        style={{ width: `${Math.min(score ?? 0, 100)}%` }}
      />
    </div>
  )
}

// ── Skeleton for past assignments ─────────────────────────────────────────────
function AssignmentSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl
                    p-4 animate-pulse flex items-center gap-3">
      <div className="w-8 h-8 bg-slate-200 rounded" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StudyModules() {
  const { progress, getProgressSummary } = useProgress()

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('planner')

  // ── Study Planner ──────────────────────────────────────────────────────────
  const [examDate,    setExamDate]    = useState(
    () => localStorage.getItem('bar_exam_date') || ''
  )
  const [studyPlan,   setStudyPlan]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('bar_study_plan') || 'null') }
    catch { return null }
  })
  const [planLoading, setPlanLoading] = useState(false)
  const [planError,   setPlanError]   = useState('')
  const [expandedDay, setExpandedDay] = useState(null)

  // ── Assignment ─────────────────────────────────────────────────────────────
  const [assignmentText,  setAssignmentText]  = useState('')
  const [assignmentFile,  setAssignmentFile]  = useState(null)
  const [assignmentTopic, setAssignmentTopic] = useState(TOPICS[0])
  const [assignmentType,  setAssignmentType]  = useState('essay')
  const [analysisResult,  setAnalysisResult]  = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError,   setAnalysisError]   = useState('')
  const [pastAssignments, setPastAssignments] = useState([])
  const [loadingPast,     setLoadingPast]     = useState(false)

  const fileInputRef = useRef(null)

  // ── Days until exam — memoized ─────────────────────────────────────────────
  const daysLeft = useMemo(() => {
    if (!examDate) return null
    const diff = new Date(examDate) - new Date()
    return Math.ceil(diff / 86400000)
  }, [examDate])

  // ── Today's plan index — memoized ─────────────────────────────────────────
  const todayIndex = useMemo(() => {
    if (!studyPlan?.generatedAt) return 0
    return Math.floor(
      (new Date() - new Date(studyPlan.generatedAt)) / 86400000
    )
  }, [studyPlan?.generatedAt])

  const todaysPlan = useMemo(
    () => studyPlan?.days?.[todayIndex] || studyPlan?.days?.[0] || null,
    [studyPlan, todayIndex]
  )

  // ── Load past assignments ──────────────────────────────────────────────────
  const loadPastAssignments = useCallback(async () => {
    setLoadingPast(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (!error && data) setPastAssignments(data)
    } catch (err) {
      console.error('Failed to load assignments:', err)
    } finally {
      setLoadingPast(false)
    }
  }, [])

  useEffect(() => { loadPastAssignments() }, [loadPastAssignments])

  // ── Generate study plan ────────────────────────────────────────────────────
  const generateStudyPlan = useCallback(async (force = false) => {
    if (!examDate)      { setPlanError('Please enter your bar exam date.'); return }
    if (daysLeft <= 0)  { setPlanError('Your exam date has already passed.'); return }

    // Confirm before overwriting existing plan
    if (studyPlan && !force) {
      const ok = window.confirm(
        'This will replace your existing study plan. Continue?'
      )
      if (!ok) return
    }

    setPlanLoading(true)
    setPlanError('')

    try {
      const progressSummary = getProgressSummary()
      const weakTopics      = progress.weakTopics?.join(', ')   || 'None identified'
      const strongTopics    = progress.strongTopics?.join(', ') || 'None identified'
      const accuracy        = progress.stats?.overallAccuracy   || 0
      const daysAvailable   = Math.min(daysLeft, 30)

      const prompt = [
        'You are an expert bar exam coach.',
        'Create a detailed personalized day-by-day study plan.',
        '',
        'STUDENT PROFILE:',
        progressSummary,
        '',
        'EXAM DETAILS:',
        'Exam Date: ' + examDate,
        'Days Until Exam: ' + daysLeft,
        'Overall Accuracy: ' + accuracy + '%',
        'Weak Topics: ' + weakTopics,
        'Strong Topics: ' + strongTopics,
        '',
        'Return ONLY valid JSON:',
        '{',
        '  "overview": "Brief 2-sentence personalized overview",',
        '  "daily_hours": 4,',
        '  "focus_strategy": "One sentence strategy",',
        '  "days": [',
        '    {',
        '      "day": 1,',
        '      "date": "YYYY-MM-DD",',
        '      "theme": "Topic Name",',
        '      "focus": "weak",',
        '      "tasks": ["Task 1", "Task 2", "Task 3"],',
        '      "goal": "What to achieve today",',
        '      "tip": "One study tip"',
        '    }',
        '  ],',
        '  "weekly_milestones": ["Week 1: milestone"]',
        '}',
        '',
        'Rules:',
        '- Prioritize weak topics in early days',
        '- Review strong topics every 5-7 days',
        '- Mock exam days every 7 days',
        '- Last 3 days: review and rest',
        '- focus: weak | strong | review | exam-sim | mixed',
        '- Generate exactly ' + daysAvailable + ' days',
      ].join('\n')

      const res  = await apiClient.chat(prompt, [])
      const plan = safeParseJSON(res.data.reply || '')

      plan.generatedAt = new Date().toISOString()
      plan.examDate    = examDate

      setStudyPlan(plan)
      localStorage.setItem('bar_study_plan', JSON.stringify(plan))
      localStorage.setItem('bar_exam_date',  examDate)

      // Sync to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('study_plans').upsert({
          user_id:    user.id,
          plan:       plan,
          exam_date:  examDate,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }

    } catch (err) {
      console.error('Plan generation error:', err)
      setPlanError(err.message || 'Failed to generate plan. Please try again.')
    } finally {
      setPlanLoading(false)
    }
  }, [examDate, daysLeft, studyPlan, progress, getProgressSummary])

  // ── Read file content ──────────────────────────────────────────────────────
  const readFileContent = (file) => new Promise((resolve, reject) => {
    if (!file) { resolve(''); return }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('File too large. Maximum size is 5MB.'))
      return
    }
    const reader  = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsText(file)
  })

  // ── Submit assignment ──────────────────────────────────────────────────────
  const submitAssignment = useCallback(async () => {
    if (!assignmentText.trim() && !assignmentFile) {
      setAnalysisError('Please enter text or upload a file.')
      return
    }

    setAnalysisLoading(true)
    setAnalysisError('')
    setAnalysisResult(null)

    try {
      let content = assignmentText.trim()
      if (assignmentFile && !content) {
        content = await readFileContent(assignmentFile)
      }
      if (!content || content.length < 20) {
        throw new Error('Assignment content is too short to analyze.')
      }

      const safeContent = content
        .substring(0, 3000)
        .replace(/"/g,  "'")
        .replace(/\\/g, ' ')
        .replace(/[\u0000-\u001F]/g, ' ')
        .replace(/\n|\r/g, ' ')
        .trim()

      const prompt = [
        'You are an expert bar exam grader.',
        'Analyze this student assignment carefully.',
        '',
        'STUDENT PROGRESS:',
        getProgressSummary(),
        '',
        'ASSIGNMENT:',
        'Type: '  + assignmentType,
        'Topic: ' + assignmentTopic,
        '',
        'SUBMISSION:',
        safeContent,
        '',
        'Return ONLY valid JSON:',
        '{',
        '  "overall_grade": "A",',
        '  "score": 85,',
        '  "summary": "2-3 sentence assessment",',
        '  "strengths": ["Strength 1", "Strength 2", "Strength 3"],',
        '  "weaknesses": ["Weakness 1", "Weakness 2"],',
        '  "rule_accuracy":     { "score": 80, "feedback": "..." },',
        '  "analysis_quality":  { "score": 75, "feedback": "..." },',
        '  "issue_spotting":    { "score": 90, "feedback": "..." },',
        '  "writing_quality":   { "score": 85, "feedback": "..." },',
        '  "improvements": ["Improvement 1", "Improvement 2"],',
        '  "model_answer_hints": "What a perfect answer includes",',
        '  "bar_exam_readiness": "developing",',
        '  "recommended_study": ["Topic 1", "Topic 2"]',
        '}',
        'overall_grade: A | B | C | D | F',
        'bar_exam_readiness: not-ready | developing | almost-ready | ready',
        'All scores: integers 0-100',
      ].join('\n')

      const res      = await apiClient.chat(prompt, [])
      const analysis = safeParseJSON(res.data.reply || '')

      setAnalysisResult(analysis)

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: saveErr } = await supabase
          .from('assignments')
          .insert({
            user_id:    user.id,
            topic:      assignmentTopic,
            type:       assignmentType,
            content:    content.substring(0, 3000),
            grade:      analysis.overall_grade,
            score:      analysis.score,
            feedback:   JSON.stringify(analysis),
            file_name:  assignmentFile?.name || null,
            created_at: new Date().toISOString(),
          })
        if (saveErr) console.error('Save assignment error:', saveErr)
        else await loadPastAssignments()
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setAnalysisError(err.message || 'Failed to analyze. Please try again.')
    } finally {
      setAnalysisLoading(false)
    }
  }, [
    assignmentText, assignmentFile, assignmentType,
    assignmentTopic, getProgressSummary, loadPastAssignments,
  ])

  const resetAssignment = useCallback(() => {
    setAnalysisResult(null)
    setAssignmentText('')
    setAssignmentFile(null)
    setAnalysisError('')
  }, [])

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-3 pb-5
                      border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Study Center
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Personalized study plan and AI-powered assignment analysis.
          </p>
        </div>

        {/* Exam countdown */}
        {examDate && daysLeft !== null && (
          <div className={`
            p-4 text-center shrink-0 border-2 rounded-2xl
            ${daysLeft <= 14
              ? 'bg-red-50 border-red-200'
              : daysLeft <= 30
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
            }
          `}>
            <div className={`text-3xl font-black
              ${daysLeft <= 14 ? 'text-red-600'
                : daysLeft <= 30 ? 'text-amber-600'
                : 'text-blue-600'
              }`}>
              {daysLeft > 0 ? daysLeft : '🎓'}
            </div>
            <div className="text-xs font-bold text-slate-500
                            uppercase tracking-wide">
              {daysLeft > 0 ? 'Days Until Exam' : 'Exam Day!'}
            </div>
            {daysLeft <= 14 && daysLeft > 0 && (
              <div className="text-[10px] text-red-600 font-bold
                              mt-1 animate-pulse">
                Final stretch! 🔥
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Progress Snapshot ── */}
      {progress.stats?.totalAttempts > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Questions',
              value: progress.stats.totalAttempts,
              color: 'text-slate-900',
            },
            {
              label: 'Accuracy',
              value: `${progress.stats.overallAccuracy}%`,
              color: 'text-blue-600',
            },
            {
              label: 'Streak',
              value: `${progress.stats.currentStreak ?? 0}🔥`,
              color: 'text-orange-500',
            },
            {
              label: 'Focus Topics',
              value: progress.weakTopics?.length || 0,
              color: 'text-amber-600',
            },
          ].map(({ label, value, color }) => (
            <div key={label}
                 className="bg-white border border-slate-200 rounded-xl
                             p-3 text-center">
              <div className={`text-xl font-extrabold ${color}`}>
                {value}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5
                              uppercase font-semibold">
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: STUDY PLANNER
      ══════════════════════════════════════════ */}
      {activeTab === 'planner' && (
        <div className="space-y-6">

          {/* Exam date input */}
          <div className="bg-white border border-slate-200 rounded-2xl
                          p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              📅 Set Your Bar Exam Date
            </h2>
            <p className="text-sm text-slate-500">
              Enter your exam date and the AI will build a personalized
              day-by-day plan based on your weak topics and progress.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400
                                   uppercase tracking-wide mb-2">
                  Bar Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl
                             px-4 py-2.5 text-sm focus:outline-none
                             focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="sm:self-end">
                <button
                  onClick={() => generateStudyPlan(false)}
                  disabled={planLoading || !examDate}
                  className="w-full sm:w-auto px-6 min-h-[44px]
                             bg-blue-600 text-white font-bold rounded-xl
                             hover:bg-blue-700 transition-colors
                             disabled:opacity-60 flex items-center gap-2"
                >
                  {planLoading
                    ? <><LoadingSpinner size="sm" color="white" /> Building…</>
                    : '🤖 Generate AI Plan'
                  }
                </button>
              </div>
            </div>

            {planError && (
              <div className="p-3 bg-red-50 border border-red-200
                              rounded-xl text-red-700 text-sm">
                ❌ {planError}
              </div>
            )}

            {progress.weakTopics?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200
                              rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 uppercase
                               tracking-wide mb-2">
                  ⚠️ AI will prioritize these weak topics:
                </p>
                <div className="flex flex-wrap gap-2">
                  {progress.weakTopics.map(t => (
                    <span key={t}
                          className="text-xs bg-amber-100 text-amber-800
                                     border border-amber-200 px-2.5 py-1
                                     rounded-full font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Today's Focus */}
          {studyPlan && todaysPlan && (
            <div className="bg-blue-600 text-white p-6 rounded-2xl
                            space-y-4">
              <div className="flex items-center justify-between
                              flex-wrap gap-2">
                <div>
                  <p className="text-blue-200 text-xs font-bold
                                uppercase tracking-wide">
                    Today's Focus
                  </p>
                  <h2 className="text-2xl font-extrabold mt-0.5">
                    Day {todaysPlan.day}: {todaysPlan.theme}
                  </h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs
                  font-bold uppercase
                  ${todaysPlan.focus === 'weak'     ? 'bg-red-500'
                    : todaysPlan.focus === 'exam-sim' ? 'bg-purple-500'
                    : todaysPlan.focus === 'review'   ? 'bg-amber-500'
                    : 'bg-blue-500'
                  } text-white`}>
                  {todaysPlan.focus}
                </span>
              </div>

              <div className="space-y-2">
                {todaysPlan.tasks?.map((task, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-300 mt-0.5 shrink-0">✓</span>
                    <span className="text-blue-50">{task}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-700/50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-bold text-blue-200 uppercase">
                  🎯 Today's Goal
                </p>
                <p className="text-sm text-white">{todaysPlan.goal}</p>
              </div>

              {todaysPlan.tip && (
                <div className="bg-blue-700/30 rounded-xl p-3">
                  <p className="text-xs text-blue-200">
                    💡 <span className="font-bold">Tip:</span>{' '}
                    {todaysPlan.tip}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Link to="/mock-exam"
                      className="flex-1 text-center py-2 bg-white
                                 text-blue-600 rounded-xl text-sm
                                 font-bold hover:bg-blue-50 transition-colors">
                  📝 Practice
                </Link>
                <Link to="/chat"
                      className="flex-1 text-center py-2 bg-blue-500
                                 text-white rounded-xl text-sm font-bold
                                 hover:bg-blue-400 transition-colors">
                  🤖 AI Coach
                </Link>
                <Link to="/blog"
                      className="flex-1 text-center py-2 bg-blue-500
                                 text-white rounded-xl text-sm font-bold
                                 hover:bg-blue-400 transition-colors">
                  📰 Blog
                </Link>
              </div>
            </div>
          )}

          {/* Plan overview */}
          {studyPlan && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200
                              rounded-2xl p-5 space-y-3">
                <h2 className="text-base font-bold text-slate-900">
                  📋 Your Personalized Study Plan
                </h2>
                <p className="text-sm text-slate-600">
                  {studyPlan.overview}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: studyPlan.days?.length, label: 'Days Planned',  color: 'text-blue-600'   },
                    { value: studyPlan.daily_hours + 'h', label: 'Daily Hours', color: 'text-purple-600' },
                    { value: daysLeft,              label: 'Days Left',    color: 'text-green-600'  },
                  ].map(({ value, label, color }) => (
                    <div key={label}
                         className="bg-white p-3 rounded-xl border
                                    border-slate-200 text-center">
                      <div className={`text-2xl font-black ${color}`}>
                        {value}
                      </div>
                      <div className="text-xs text-slate-500 uppercase
                                      font-semibold">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-100
                                rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-800 uppercase mb-1">
                    Strategy
                  </p>
                  <p className="text-sm text-blue-700">
                    {studyPlan.focus_strategy}
                  </p>
                </div>
              </div>

              {/* Weekly milestones */}
              {studyPlan.weekly_milestones?.length > 0 && (
                <div className="bg-white border border-slate-200
                                rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-800
                                 uppercase tracking-wide">
                    🏁 Weekly Milestones
                  </h3>
                  {studyPlan.weekly_milestones.map((m, i) => (
                    <div key={i}
                         className="flex items-start gap-3 p-3
                                    bg-slate-50 rounded-xl border border-slate-100">
                      <span className="w-6 h-6 bg-blue-600 text-white
                                       rounded-full flex items-center
                                       justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700">{m}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Day-by-day */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800
                               uppercase tracking-wide">
                  📆 Day-by-Day Schedule
                </h3>
                {studyPlan.days?.map(day => {
                  const isExpanded    = expandedDay === day.day
                  const isActualToday = todayIndex === day.day - 1

                  return (
                    <div
                      key={day.day}
                      className={`
                        border border-slate-200 rounded-xl overflow-hidden
                        border-l-4 transition-all
                        ${FOCUS_COLORS[day.focus] || 'border-l-slate-300 bg-white'}
                        ${isActualToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                      `}
                    >
                      <button
                        onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                        className="w-full flex items-center justify-between
                                   p-4 text-left hover:bg-white/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center
                            justify-center text-sm font-black shrink-0
                            ${isActualToday
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700'
                            }
                          `}>
                            {day.day}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-slate-900 text-sm">
                                {day.theme}
                              </p>
                              {isActualToday && (
                                <span className="text-[10px] bg-blue-600
                                                 text-white px-2 py-0.5
                                                 rounded-full font-bold">
                                  TODAY
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {day.date} •{' '}
                              <span className="capitalize font-medium">
                                {day.focus}
                              </span>
                            </p>
                          </div>
                        </div>
                        <span className={`text-slate-400 text-xs transition-transform
                          ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t
                                        border-slate-100 pt-3">
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400
                                          uppercase tracking-wide mb-2">
                              Tasks
                            </p>
                            {day.tasks?.map((task, i) => (
                              <div key={i}
                                   className="flex items-start gap-2
                                              text-sm text-slate-700">
                                <span className="text-blue-500 mt-0.5
                                                 shrink-0 font-bold">
                                  {i + 1}.
                                </span>
                                {task}
                              </div>
                            ))}
                          </div>

                          <div className="bg-white border border-slate-200
                                          rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400
                                          uppercase tracking-wide mb-1">
                              🎯 Goal
                            </p>
                            <p className="text-sm text-slate-700">{day.goal}</p>
                          </div>

                          {day.tip && (
                            <div className="bg-amber-50 border border-amber-100
                                            rounded-xl p-3">
                              <p className="text-xs text-amber-700">
                                💡 <span className="font-bold">Tip:</span> {day.tip}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Link to="/mock-exam"
                                  className="flex-1 text-center py-2
                                             bg-blue-600 text-white rounded-xl
                                             text-xs font-bold hover:bg-blue-700
                                             transition-colors">
                              Practice
                            </Link>
                            <Link to="/chat"
                                  className="flex-1 text-center py-2
                                             bg-slate-100 text-slate-700 rounded-xl
                                             text-xs font-bold hover:bg-slate-200
                                             transition-colors">
                              AI Coach
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => generateStudyPlan(false)}
                disabled={planLoading}
                className="w-full py-2.5 text-sm font-medium border
                           border-slate-200 text-slate-600 rounded-xl
                           hover:bg-slate-50 transition-colors
                           disabled:opacity-60"
              >
                {planLoading ? 'Regenerating…' : '🔄 Regenerate Plan'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: ASSIGNMENT
      ══════════════════════════════════════════ */}
      {activeTab === 'assignment' && (
        <div className="space-y-6">

          {/* Submit form */}
          <div className="bg-white border border-slate-200 rounded-2xl
                          p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                📝 Submit Assignment for AI Analysis
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Submit your essay, memo, brief, or practice answer.
                AI will grade it and give detailed feedback.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400
                                   uppercase tracking-wide mb-2">
                  Topic
                </label>
                <select
                  value={assignmentTopic}
                  onChange={e => setAssignmentTopic(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl
                             px-4 py-2.5 text-sm focus:outline-none
                             focus:border-blue-500 transition-colors bg-white"
                >
                  {TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400
                                   uppercase tracking-wide mb-2">
                  Type
                </label>
                <select
                  value={assignmentType}
                  onChange={e => setAssignmentType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl
                             px-4 py-2.5 text-sm focus:outline-none
                             focus:border-blue-500 transition-colors bg-white"
                >
                  {ASSIGNMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400
                                 uppercase tracking-wide mb-2">
                Your Assignment Text
              </label>
              <textarea
                value={assignmentText}
                onChange={e => setAssignmentText(e.target.value)}
                placeholder="Paste or type your assignment here..."
                rows={10}
                className="w-full border border-slate-200 rounded-xl
                           px-4 py-2.5 text-sm resize-none font-mono
                           focus:outline-none focus:border-blue-500
                           transition-colors"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">
                  Be as detailed as possible
                </span>
                <span className={`text-[10px] ${
                  assignmentText.length > 3000
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}>
                  {assignmentText.length} / 3000
                  {assignmentText.length > 3000 && ' (truncated)'}
                </span>
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-xs font-bold text-slate-400
                                 uppercase tracking-wide mb-2">
                Or Upload a File
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6
                            text-center cursor-pointer transition-colors
                            ${assignmentFile
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
                            }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => setAssignmentFile(e.target.files?.[0] || null)}
                />
                {assignmentFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-700">
                      📎 {assignmentFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(assignmentFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={e => { e.stopPropagation(); setAssignmentFile(null) }}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-2xl">📁</p>
                    <p className="text-sm text-slate-600 font-medium">
                      Click to upload
                    </p>
                    <p className="text-xs text-slate-400">TXT, PDF, DOC — up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {analysisError && (
              <div className="p-3 bg-red-50 border border-red-200
                              rounded-xl text-red-700 text-sm flex gap-2">
                <span>❌</span>
                <span>{analysisError}</span>
              </div>
            )}

            <button
              onClick={submitAssignment}
              disabled={analysisLoading || (!assignmentText.trim() && !assignmentFile)}
              className="w-full py-3 bg-blue-600 text-white font-bold
                         rounded-xl hover:bg-blue-700 transition-colors
                         disabled:opacity-60 flex items-center
                         justify-center gap-2 min-h-[48px]"
            >
              {analysisLoading
                ? <><LoadingSpinner size="sm" color="white" /> Analyzing…</>
                : '🤖 Submit for AI Analysis'
              }
            </button>
          </div>

          {/* Analysis result */}
          {analysisResult && (
            <div className="space-y-4">
              {/* Grade banner */}
              <div className={`p-6 rounded-2xl border-2
                ${GRADE_BG[analysisResult.overall_grade] || 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center
                                sm:justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500
                                  uppercase tracking-wide">
                      AI Grade — {assignmentType} on {assignmentTopic}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-6xl font-black
                        ${GRADE_COLORS[analysisResult.overall_grade] || 'text-slate-600'}`}>
                        {analysisResult.overall_grade}
                      </span>
                      <div>
                        <div className="text-2xl font-extrabold text-slate-900">
                          {analysisResult.score}/100
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1
                          rounded-full
                          ${(READINESS[analysisResult.bar_exam_readiness] || READINESS['developing']).color}`}>
                          {(READINESS[analysisResult.bar_exam_readiness] || READINESS['developing']).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 min-w-[200px]">
                    {[
                      { label: 'Rule Accuracy',    score: analysisResult.rule_accuracy?.score    },
                      { label: 'Analysis Quality', score: analysisResult.analysis_quality?.score },
                      { label: 'Issue Spotting',   score: analysisResult.issue_spotting?.score   },
                      { label: 'Writing Quality',  score: analysisResult.writing_quality?.score  },
                    ].map(({ label, score }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                          <span>{label}</span>
                          <span className="font-bold">{score}%</span>
                        </div>
                        <ScoreBar score={score} />
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-slate-700 mt-4 leading-relaxed
                              border-t border-slate-200/50 pt-4">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200
                                rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-green-800 uppercase">
                    ✅ Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2
                                             text-sm text-green-900">
                        <span className="text-green-500 shrink-0 font-bold">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200
                                rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-red-800 uppercase">
                    ⚠️ Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start gap-2
                                             text-sm text-red-900">
                        <span className="text-red-500 shrink-0">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Detailed feedback */}
              <div className="bg-white border border-slate-200 rounded-2xl
                              p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase">
                  🔍 Detailed Feedback
                </h3>
                {[
                  { label: 'Rule Accuracy',    data: analysisResult.rule_accuracy    },
                  { label: 'Analysis Quality', data: analysisResult.analysis_quality },
                  { label: 'Issue Spotting',   data: analysisResult.issue_spotting   },
                  { label: 'Writing Quality',  data: analysisResult.writing_quality  },
                ].filter(({ data }) => data).map(({ label, data }) => (
                  <div key={label}
                       className="p-4 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-700 uppercase">
                        {label}
                      </p>
                      <span className={`text-sm font-extrabold
                        ${data.score >= 80 ? 'text-green-600'
                          : data.score >= 60 ? 'text-blue-600'
                          : 'text-amber-600'
                        }`}>
                        {data.score}%
                      </span>
                    </div>
                    <ScoreBar score={data.score} />
                    <p className="text-xs text-slate-600">{data.feedback}</p>
                  </div>
                ))}
              </div>

              {/* Improvements */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-blue-900 uppercase mb-3">
                  🚀 How to Improve
                </h3>
                <ol className="space-y-2">
                  {analysisResult.improvements?.map((imp, i) => (
                    <li key={i} className="flex items-start gap-3
                                           text-sm text-blue-900">
                      <span className="w-5 h-5 bg-blue-600 text-white
                                       rounded-full flex items-center
                                       justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      {imp}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Model answer */}
              {analysisResult.model_answer_hints && (
                <div className="bg-amber-50 border border-amber-200
                                rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-amber-900 uppercase mb-2">
                    📖 Perfect Answer Guide
                  </h3>
                  <p className="text-sm text-amber-800">
                    {analysisResult.model_answer_hints}
                  </p>
                </div>
              )}

              {/* Recommended study */}
              {analysisResult.recommended_study?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-3">
                    📚 Recommended Study Areas
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {analysisResult.recommended_study.map((topic, i) => (
                      <Link key={i} to="/chat"
                            className="text-xs bg-slate-100 border border-slate-200
                                       text-slate-700 px-3 py-1.5 rounded-full
                                       hover:bg-blue-50 hover:border-blue-300
                                       hover:text-blue-700 transition-colors font-medium">
                        📖 {topic}
                      </Link>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link to="/mock-exam"
                          className="flex-1 text-center py-2.5 bg-blue-600
                                     text-white rounded-xl text-sm font-bold
                                     hover:bg-blue-700 transition-colors">
                      📝 Practice
                    </Link>
                    <Link to="/blog"
                          className="flex-1 text-center py-2.5 bg-slate-100
                                     text-slate-700 rounded-xl text-sm font-bold
                                     hover:bg-slate-200 transition-colors">
                      📰 Blog Tips
                    </Link>
                    <Link to="/tutorials"
                          className="flex-1 text-center py-2.5 bg-slate-100
                                     text-slate-700 rounded-xl text-sm font-bold
                                     hover:bg-slate-200 transition-colors">
                      🎥 Tutorials
                    </Link>
                  </div>
                </div>
              )}

              <button
                onClick={resetAssignment}
                className="w-full py-2.5 text-sm font-medium border
                           border-slate-200 text-slate-600 rounded-xl
                           hover:bg-slate-50 transition-colors"
              >
                ✍️ Submit Another Assignment
              </button>
            </div>
          )}

          {/* Past assignments */}
          {!analysisResult && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                📋 Past Submissions
              </h3>

              {loadingPast ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <AssignmentSkeleton key={i} />)}
                </div>
              ) : pastAssignments.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl
                                text-center py-8">
                  <p className="text-slate-500 text-sm">
                    No submissions yet. Submit an assignment above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastAssignments.map((a, i) => {
                    let parsed = null
                    try { parsed = JSON.parse(a.feedback) } catch {}
                    return (
                      <details
                        key={a.id || i}
                        className="bg-white border border-slate-200
                                   rounded-xl overflow-hidden
                                   hover:border-slate-300 transition-all"
                      >
                        <summary className="flex items-center justify-between
                                            p-4 cursor-pointer select-none list-none">
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl font-black
                              ${GRADE_COLORS[a.grade] || 'text-slate-600'}`}>
                              {a.grade || '?'}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {a.topic} — {a.type}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {a.score}/100 •{' '}
                                {a.created_at
                                  ? new Date(a.created_at).toLocaleDateString()
                                  : 'Just now'
                                }
                                {a.file_name && ` • 📎 ${a.file_name}`}
                              </p>
                            </div>
                          </div>
                          <span className="text-slate-400 text-xs">▼</span>
                        </summary>

                        {parsed && (
                          <div className="p-4 border-t border-slate-100
                                          bg-slate-50 space-y-3">
                            <p className="text-sm text-slate-700">{parsed.summary}</p>
                            {parsed.improvements?.slice(0, 2).map((imp, j) => (
                              <p key={j}
                                 className="text-xs text-slate-600 flex gap-1.5">
                                <span className="text-blue-500">→</span>
                                {imp}
                              </p>
                            ))}
                          </div>
                        )}
                      </details>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
