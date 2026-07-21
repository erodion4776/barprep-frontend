import { useState, useEffect, useRef } from 'react'
import { apiClient, supabase } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import ReactMarkdown from 'react-markdown'
import { useProgress } from '../context/ProgressContext'
import { Link } from 'react-router-dom'

export default function StudyModules() {
  // ── Tabs ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('planner')

  // ── Study Planner ─────────────────────────────────────────────
  const [examDate, setExamDate]     = useState(
    () => localStorage.getItem('bar_exam_date') || ''
  )
  const [studyPlan, setStudyPlan]   = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bar_study_plan') || 'null')
    } catch { return null }
  })
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError]     = useState('')
  const [expandedDay, setExpandedDay] = useState(null)

  // ── Assignment ────────────────────────────────────────────────
  const [assignmentText, setAssignmentText]   = useState('')
  const [assignmentFile, setAssignmentFile]   = useState(null)
  const [assignmentTopic, setAssignmentTopic] = useState('Constitutional Law')
  const [assignmentType, setAssignmentType]   = useState('essay')
  const [analysisResult, setAnalysisResult]   = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError]     = useState('')
  const [pastAssignments, setPastAssignments] = useState([])
  const [loadingPast, setLoadingPast]         = useState(false)
  const fileInputRef                          = useRef(null)

  const { progress, getProgressSummary } = useProgress()

  const TOPICS = [
    'Constitutional Law', 'Contracts', 'Torts', 'Criminal Law',
    'Civil Procedure', 'Evidence', 'Real Property',
    'Business Associations', 'Family Law', 'Wills & Trusts',
  ]

  const ASSIGNMENT_TYPES = [
    { value: 'essay',    label: '📝 Essay Answer'      },
    { value: 'memo',     label: '📄 Legal Memo'        },
    { value: 'brief',    label: '⚖️ Case Brief'        },
    { value: 'outline',  label: '📋 Topic Outline'     },
    { value: 'practice', label: '✍️ Practice Question' },
  ]

  useEffect(() => { loadPastAssignments() }, [])

  // ── Days until exam ───────────────────────────────────────────
  const getDaysUntilExam = () => {
    if (!examDate) return null
    const diff = new Date(examDate) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const daysLeft = getDaysUntilExam()

  // ── Generate Study Plan ───────────────────────────────────────
  // FIX: Use array.join instead of template literals to avoid
  // JSON parsing errors caused by special characters in strings
  const generateStudyPlan = async () => {
    if (!examDate) {
      setPlanError('Please enter your bar exam date first.')
      return
    }
    if (daysLeft <= 0) {
      setPlanError('Your exam date has already passed.')
      return
    }

    setPlanLoading(true)
    setPlanError('')

    try {
      const progressSummary = getProgressSummary()
      const weakTopics      = progress.weakTopics?.join(', ') || 'None identified'
      const strongTopics    = progress.strongTopics?.join(', ') || 'None identified'
      const accuracy        = progress.stats?.overallAccuracy || 0
      const daysAvailable   = Math.min(daysLeft, 30)

      // ── Build prompt safely without nested template literals ──
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
        'Weak Topics that need most work: ' + weakTopics,
        'Strong Topics to maintain: ' + strongTopics,
        '',
        'Return ONLY valid JSON with no extra text before or after:',
        '{',
        '  "overview": "Brief 2-sentence personalized overview",',
        '  "daily_hours": 4,',
        '  "focus_strategy": "One sentence about the main strategy",',
        '  "days": [',
        '    {',
        '      "day": 1,',
        '      "date": "YYYY-MM-DD",',
        '      "theme": "Topic Name",',
        '      "focus": "weak",',
        '      "tasks": ["Task 1", "Task 2", "Task 3"],',
        '      "goal": "What student should achieve today",',
        '      "tip": "One specific study tip for today"',
        '    }',
        '  ],',
        '  "weekly_milestones": [',
        '    "Week 1: milestone description"',
        '  ]',
        '}',
        '',
        'Rules:',
        '- Prioritize weak topics heavily in early days',
        '- Space strong topic reviews every 5 to 7 days',
        '- Include mock exam simulation days every 7 days',
        '- Last 3 days should be review and rest',
        '- Make tasks specific and actionable',
        '- focus field must be one of: weak, strong, review, exam-sim, mixed',
        '- Generate exactly ' + daysAvailable + ' days total',
      ].join('\n')

      const res = await apiClient.chat(prompt, [])
      const raw = res.data.reply || ''

      // ── Extract JSON safely ───────────────────────────────────
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Could not parse study plan. Please try again.')
      }

      let plan
      try {
        plan = JSON.parse(jsonMatch[0])
      } catch (parseErr) {
        // ── Auto-fix common JSON issues and retry ─────────────
        const cleaned = jsonMatch[0]
          .replace(/,(\s*[}\]])/g, '$1')    // remove trailing commas
          .replace(/[\u0000-\u001F]/g, ' ') // remove control characters
          .replace(/\t/g, ' ')              // replace tabs
        plan = JSON.parse(cleaned)
      }

      plan.generatedAt = new Date().toISOString()
      plan.examDate    = examDate

      setStudyPlan(plan)
      localStorage.setItem('bar_study_plan', JSON.stringify(plan))
      localStorage.setItem('bar_exam_date', examDate)

    } catch (err) {
      console.error('Plan generation error:', err)
      setPlanError(
        err.message || 'Failed to generate study plan. Please try again.'
      )
    } finally {
      setPlanLoading(false)
    }
  }

  // ── Load past assignments ─────────────────────────────────────
  const loadPastAssignments = async () => {
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
  }

  // ── Read file content ─────────────────────────────────────────
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) { resolve(''); return }

      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        reject(new Error('File too large. Maximum size is 5MB.'))
        return
      }

      const reader     = new FileReader()
      reader.onload    = (e) => resolve(e.target.result)
      reader.onerror   = () => reject(new Error('Failed to read file.'))
      reader.readAsText(file)
    })
  }

  // ── Submit Assignment ─────────────────────────────────────────
  // FIX: Sanitize content before building prompt to avoid
  // JSON parsing errors from student submission text
  const submitAssignment = async () => {
    if (!assignmentText.trim() && !assignmentFile) {
      setAnalysisError('Please enter your assignment text or upload a file.')
      return
    }

    setAnalysisLoading(true)
    setAnalysisError('')
    setAnalysisResult(null)

    try {
      let contentToAnalyze = assignmentText.trim()

      if (assignmentFile && !contentToAnalyze) {
        contentToAnalyze = await readFileContent(assignmentFile)
      }

      if (!contentToAnalyze || contentToAnalyze.length < 20) {
        throw new Error('Assignment content is too short to analyze.')
      }

      const progressSummary = getProgressSummary()

      // ── Sanitize student content to prevent JSON errors ───────
      const safeContent = contentToAnalyze
        .substring(0, 3000)
        .replace(/"/g, "'")            // replace double quotes
        .replace(/\\/g, ' ')           // remove backslashes
        .replace(/[\u0000-\u001F]/g, ' ') // remove control chars
        .replace(/\n/g, ' ')           // flatten newlines
        .replace(/\r/g, ' ')           // remove carriage returns
        .trim()

      // ── Build prompt safely ───────────────────────────────────
      const prompt = [
        'You are an expert bar exam grader and coach.',
        'Analyze this student assignment carefully.',
        '',
        'STUDENT PROGRESS:',
        progressSummary,
        '',
        'ASSIGNMENT DETAILS:',
        'Type: ' + assignmentType,
        'Topic: ' + assignmentTopic,
        '',
        'STUDENT SUBMISSION:',
        safeContent,
        '',
        'Return ONLY valid JSON with no extra text before or after:',
        '{',
        '  "overall_grade": "A",',
        '  "score": 85,',
        '  "summary": "2 to 3 sentence overall assessment",',
        '  "strengths": [',
        '    "Specific strength 1",',
        '    "Specific strength 2",',
        '    "Specific strength 3"',
        '  ],',
        '  "weaknesses": [',
        '    "Specific weakness 1",',
        '    "Specific weakness 2"',
        '  ],',
        '  "rule_accuracy": {',
        '    "score": 80,',
        '    "feedback": "How accurately student stated legal rules"',
        '  },',
        '  "analysis_quality": {',
        '    "score": 75,',
        '    "feedback": "Quality of legal analysis and reasoning"',
        '  },',
        '  "issue_spotting": {',
        '    "score": 90,',
        '    "feedback": "How well student identified legal issues"',
        '  },',
        '  "writing_quality": {',
        '    "score": 85,',
        '    "feedback": "Clarity and organization of writing"',
        '  },',
        '  "improvements": [',
        '    "Specific actionable improvement 1",',
        '    "Specific actionable improvement 2",',
        '    "Specific actionable improvement 3"',
        '  ],',
        '  "model_answer_hints": "Brief description of what a perfect answer includes",',
        '  "bar_exam_readiness": "developing",',
        '  "recommended_study": ["Topic 1", "Topic 2"]',
        '}',
        '',
        'overall_grade must be exactly one of: A, B, C, D, F',
        'bar_exam_readiness must be exactly one of: not-ready, developing, almost-ready, ready',
        'All scores must be integers between 0 and 100',
      ].join('\n')

      const res    = await apiClient.chat(prompt, [])
      const raw    = res.data.reply || ''
      const jMatch = raw.match(/\{[\s\S]*\}/)

      if (!jMatch) {
        throw new Error('Could not parse analysis. Please try again.')
      }

      let analysis
      try {
        analysis = JSON.parse(jMatch[0])
      } catch (parseErr) {
        // ── Auto-fix common JSON issues and retry ─────────────
        const cleaned = jMatch[0]
          .replace(/,(\s*[}\]])/g, '$1')    // remove trailing commas
          .replace(/[\u0000-\u001F]/g, ' ') // remove control chars
          .replace(/\t/g, ' ')              // replace tabs
        analysis = JSON.parse(cleaned)
      }

      setAnalysisResult(analysis)

      // ── Save to Supabase ──────────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: saveErr } = await supabase
          .from('assignments')
          .insert({
            user_id:    user.id,
            topic:      assignmentTopic,
            type:       assignmentType,
            content:    contentToAnalyze.substring(0, 3000),
            grade:      analysis.overall_grade,
            score:      analysis.score,
            feedback:   JSON.stringify(analysis),
            file_name:  assignmentFile?.name || null,
            created_at: new Date().toISOString(),
          })
        if (saveErr) console.error('Failed to save assignment:', saveErr)
        loadPastAssignments()
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setAnalysisError(
        err.message || 'Failed to analyze assignment. Please try again.'
      )
    } finally {
      setAnalysisLoading(false)
    }
  }

  // ── Grade helpers ─────────────────────────────────────────────
  const gradeColor = (grade) => {
    const map = {
      A: 'text-green-600',  B: 'text-blue-600',
      C: 'text-amber-600',  D: 'text-orange-600',
      F: 'text-red-600',
    }
    return map[grade] || 'text-slate-600'
  }

  const gradeBackground = (grade) => {
    const map = {
      A: 'bg-green-50 border-green-200',
      B: 'bg-blue-50 border-blue-200',
      C: 'bg-amber-50 border-amber-200',
      D: 'bg-orange-50 border-orange-200',
      F: 'bg-red-50 border-red-200',
    }
    return map[grade] || 'bg-slate-50 border-slate-200'
  }

  const readinessConfig = (r) => {
    const map = {
      'not-ready':    { label: 'Not Ready',     color: 'bg-red-100 text-red-700'     },
      'developing':   { label: 'Developing',    color: 'bg-amber-100 text-amber-700' },
      'almost-ready': { label: 'Almost Ready',  color: 'bg-blue-100 text-blue-700'   },
      'ready':        { label: 'Bar Ready! 🎉', color: 'bg-green-100 text-green-700' },
    }
    return map[r] || { label: r, color: 'bg-slate-100 text-slate-700' }
  }

  const scoreBar = (score) => (
    <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
      <div
        className={`h-2 rounded-full transition-all ${
          score >= 80 ? 'bg-green-500'
          : score >= 60 ? 'bg-blue-500'
          : 'bg-amber-500'
        }`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  )

  // ── Today's plan ──────────────────────────────────────────────
  const getTodaysPlan = () => {
    if (!studyPlan?.days) return null
    const generated = new Date(studyPlan.generatedAt)
    const dayIndex  = Math.floor(
      (new Date() - generated) / (1000 * 60 * 60 * 24)
    )
    return studyPlan.days[dayIndex] || studyPlan.days[0]
  }

  const todaysPlan = getTodaysPlan()

  const tabs = [
    { id: 'planner',    label: '📅 Study Planner' },
    { id: 'assignment', label: '📝 Assignment'     },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-3 border-b
                      border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold
                         text-slate-900 tracking-tight">
            Study Center
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Personalized study plan and AI-powered assignment analysis.
          </p>
        </div>

        {/* Exam countdown */}
        {examDate && daysLeft !== null && (
          <div className={`card p-4 text-center shrink-0 border-2
            ${daysLeft <= 14
              ? 'bg-red-50 border-red-200'
              : daysLeft <= 30
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'}`}>
            <div className={`text-3xl font-black
              ${daysLeft <= 14 ? 'text-red-600'
                : daysLeft <= 30 ? 'text-amber-600'
                : 'text-blue-600'}`}>
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

      {/* ── Quick Progress Snapshot ──────────────────────────── */}
      {progress.stats?.totalAttempts > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Questions Done',
              value: progress.stats.totalAttempts,
              color: 'text-slate-900',
            },
            {
              label: 'Accuracy',
              value: `${progress.stats.overallAccuracy}%`,
              color: 'text-blue-600',
            },
            {
              label: 'Strong Topics',
              value: progress.strongTopics?.length || 0,
              color: 'text-green-600',
            },
            {
              label: 'Focus Topics',
              value: progress.weakTopics?.length || 0,
              color: 'text-amber-600',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
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

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-semibold
                        border-b-2 transition-colors
                        ${activeTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-500
                             hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: STUDY PLANNER
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'planner' && (
        <div className="space-y-6">

          {/* Exam Date Input */}
          <div className="card bg-white border border-slate-200
                          p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              📅 Set Your Bar Exam Date
            </h2>
            <p className="text-sm text-slate-500">
              Enter your exam date and the AI will build a personalized
              day-by-day study plan based on your weak topics and progress.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold
                                  text-slate-400 uppercase
                                  tracking-wide mb-2">
                  Bar Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div className="sm:self-end">
                <button
                  onClick={generateStudyPlan}
                  disabled={planLoading || !examDate}
                  className="btn-primary w-full sm:w-auto
                             min-h-[44px] px-6 flex items-center gap-2">
                  {planLoading
                    ? <><LoadingSpinner size="sm" /> Building Plan...</>
                    : '🤖 Generate AI Study Plan'}
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
                <p className="text-xs font-bold text-amber-800
                              uppercase tracking-wide mb-2">
                  ⚠️ AI will prioritize these weak topics in your plan:
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
            <div className="card bg-blue-600 text-white p-6
                            rounded-2xl space-y-4">
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
                  ${todaysPlan.focus === 'weak'
                    ? 'bg-red-500 text-white'
                  : todaysPlan.focus === 'exam-sim'
                    ? 'bg-purple-500 text-white'
                  : todaysPlan.focus === 'review'
                    ? 'bg-amber-500 text-white'
                  : 'bg-blue-500 text-white'}`}>
                  {todaysPlan.focus}
                </span>
              </div>

              <div className="space-y-2">
                {todaysPlan.tasks?.map((task, i) => (
                  <div key={i}
                    className="flex items-start gap-2 text-sm">
                    <span className="text-blue-300 mt-0.5 shrink-0">
                      ✓
                    </span>
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
                    💡{' '}
                    <span className="font-bold">Tip:</span>{' '}
                    {todaysPlan.tip}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Link to="/mock-exam"
                  className="flex-1 text-center py-2 bg-white
                             text-blue-600 rounded-xl text-sm
                             font-bold hover:bg-blue-50
                             transition-colors">
                  📝 Practice Questions
                </Link>
                <Link to="/chat"
                  className="flex-1 text-center py-2 bg-blue-500
                             text-white rounded-xl text-sm font-bold
                             hover:bg-blue-400 transition-colors">
                  🤖 Ask AI Coach
                </Link>
              </div>
            </div>
          )}

          {/* Study Plan Overview */}
          {studyPlan && (
            <div className="space-y-4">

              <div className="card bg-slate-50 border border-slate-200
                              p-5 rounded-2xl space-y-3">
                <h2 className="text-base font-bold text-slate-900">
                  📋 Your Personalized Study Plan
                </h2>
                <p className="text-sm text-slate-600">
                  {studyPlan.overview}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      value: studyPlan.days?.length,
                      label: 'Days Planned',
                      color: 'text-blue-600',
                    },
                    {
                      value: studyPlan.daily_hours + 'h',
                      label: 'Daily Study Hours',
                      color: 'text-purple-600',
                    },
                    {
                      value: daysLeft,
                      label: 'Days Remaining',
                      color: 'text-green-600',
                    },
                  ].map(({ value, label, color }) => (
                    <div key={label}
                      className="bg-white p-3 rounded-xl border
                                 border-slate-200 text-center">
                      <div className={`text-2xl font-black ${color}`}>
                        {value}
                      </div>
                      <div className="text-xs text-slate-500
                                      uppercase font-semibold">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-100
                                rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-800
                                uppercase mb-1">
                    Strategy
                  </p>
                  <p className="text-sm text-blue-700">
                    {studyPlan.focus_strategy}
                  </p>
                </div>
              </div>

              {/* Weekly Milestones */}
              {studyPlan.weekly_milestones?.length > 0 && (
                <div className="card bg-white border border-slate-200
                                p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-slate-800
                                 uppercase tracking-wide">
                    🏁 Weekly Milestones
                  </h3>
                  <div className="space-y-2">
                    {studyPlan.weekly_milestones.map((m, i) => (
                      <div key={i}
                        className="flex items-start gap-3 p-3
                                   bg-slate-50 rounded-xl
                                   border border-slate-100">
                        <span className="w-6 h-6 bg-blue-600
                                         text-white rounded-full
                                         flex items-center justify-center
                                         text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-700">{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day-by-Day Plan */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800
                               uppercase tracking-wide">
                  📆 Day-by-Day Schedule
                </h3>

                {studyPlan.days?.map((day) => {
                  const isExpanded    = expandedDay === day.day
                  const generated     = new Date(studyPlan.generatedAt)
                  const dayIdx        = Math.floor(
                    (new Date() - generated) / (1000 * 60 * 60 * 24)
                  )
                  const isActualToday = dayIdx === day.day - 1

                  const focusColors = {
                    weak:       'border-l-red-500 bg-red-50',
                    strong:     'border-l-green-500 bg-green-50',
                    review:     'border-l-amber-500 bg-amber-50',
                    'exam-sim': 'border-l-purple-500 bg-purple-50',
                    mixed:      'border-l-blue-500 bg-blue-50',
                  }

                  return (
                    <div key={day.day}
                      className={`card border border-slate-200
                                  rounded-xl overflow-hidden border-l-4
                                  transition-all
                                  ${focusColors[day.focus]
                                    || 'border-l-slate-300 bg-white'}
                                  ${isActualToday
                                    ? 'ring-2 ring-blue-400 ring-offset-1'
                                    : ''}`}>

                      <button
                        onClick={() => setExpandedDay(
                          isExpanded ? null : day.day
                        )}
                        className="w-full flex items-center
                                   justify-between p-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex
                            items-center justify-center text-sm
                            font-black shrink-0
                            ${isActualToday
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-slate-200
                                 text-slate-700'}`}>
                            {day.day}
                          </div>
                          <div>
                            <div className="flex items-center gap-2
                                            flex-wrap">
                              <p className="font-semibold text-slate-900
                                            text-sm">
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
                        <span className={`text-slate-400 text-xs
                          transition-transform
                          ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3
                                        border-t border-slate-100 pt-3">
                          <div>
                            <p className="text-[10px] font-bold
                                          text-slate-400 uppercase
                                          tracking-wide mb-2">
                              Tasks
                            </p>
                            <div className="space-y-1.5">
                              {day.tasks?.map((task, i) => (
                                <div key={i}
                                  className="flex items-start gap-2
                                             text-sm text-slate-700">
                                  <span className="text-blue-500
                                                   mt-0.5 shrink-0
                                                   font-bold">
                                    {i + 1}.
                                  </span>
                                  {task}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white border
                                          border-slate-200 rounded-xl
                                          p-3 space-y-1">
                            <p className="text-[10px] font-bold
                                          text-slate-400 uppercase
                                          tracking-wide">
                              🎯 Goal
                            </p>
                            <p className="text-sm text-slate-700">
                              {day.goal}
                            </p>
                          </div>

                          {day.tip && (
                            <div className="bg-amber-50 border
                                            border-amber-100
                                            rounded-xl p-3">
                              <p className="text-xs text-amber-700">
                                💡{' '}
                                <span className="font-bold">Tip:</span>{' '}
                                {day.tip}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Link to="/mock-exam"
                              className="flex-1 text-center py-2
                                         bg-blue-600 text-white
                                         rounded-xl text-xs font-bold
                                         hover:bg-blue-700
                                         transition-colors">
                              Practice Questions
                            </Link>
                            <Link to="/chat"
                              className="flex-1 text-center py-2
                                         bg-slate-100 text-slate-700
                                         rounded-xl text-xs font-bold
                                         hover:bg-slate-200
                                         transition-colors">
                              Ask AI Coach
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={generateStudyPlan}
                disabled={planLoading}
                className="btn-secondary w-full text-sm">
                {planLoading ? 'Regenerating...' : '🔄 Regenerate Plan'}
              </button>
            </div>
          )}

        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: ASSIGNMENT
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'assignment' && (
        <div className="space-y-6">

          {/* Submit Form */}
          <div className="card bg-white border border-slate-200
                          p-6 rounded-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                📝 Submit Assignment for AI Analysis
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Submit your essay, memo, brief, or practice answer.
                The AI will grade it and give detailed feedback based
                on your progress.
              </p>
            </div>

            {/* Topic + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold
                                  text-slate-400 uppercase
                                  tracking-wide mb-2">
                  Topic
                </label>
                <select
                  value={assignmentTopic}
                  onChange={(e) => setAssignmentTopic(e.target.value)}
                  className="input-field w-full">
                  {TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold
                                  text-slate-400 uppercase
                                  tracking-wide mb-2">
                  Assignment Type
                </label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="input-field w-full">
                  {ASSIGNMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400
                                uppercase tracking-wide mb-2">
                Your Answer / Assignment Text
              </label>
              <textarea
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                placeholder="Paste or type your assignment here..."
                rows={10}
                className="input-field w-full resize-none
                           font-mono text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {assignmentText.length} characters
                {assignmentText.length > 3000 && (
                  <span className="text-amber-600 ml-1">
                    (Only first 3000 characters will be analyzed)
                  </span>
                )}
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-400
                                uppercase tracking-wide mb-2">
                Or Upload a File (TXT, PDF, DOC)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6
                            text-center cursor-pointer transition-colors
                            ${assignmentFile
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-slate-300 hover:border-blue-300
                                 hover:bg-slate-50'}`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setAssignmentFile(f)
                  }}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        setAssignmentFile(null)
                      }}
                      className="text-xs text-red-500
                                 hover:text-red-700 underline">
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-2xl">📁</p>
                    <p className="text-sm text-slate-600 font-medium">
                      Click to upload your assignment
                    </p>
                    <p className="text-xs text-slate-400">
                      TXT, PDF, DOC up to 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {analysisError && (
              <div className="p-3 bg-red-50 border border-red-200
                              rounded-xl text-red-700 text-sm">
                ❌ {analysisError}
              </div>
            )}

            <button
              onClick={submitAssignment}
              disabled={
                analysisLoading ||
                (!assignmentText.trim() && !assignmentFile)
              }
              className="btn-primary w-full min-h-[48px] py-3
                         text-base flex justify-center
                         items-center gap-2">
              {analysisLoading
                ? <><LoadingSpinner size="sm" /> AI is analyzing...</>
                : '🤖 Submit for AI Analysis'}
            </button>
          </div>

          {/* Analysis Result */}
          {analysisResult && (
            <div className="space-y-4">

              {/* Grade Banner */}
              <div className={`card p-6 rounded-2xl border-2
                ${gradeBackground(analysisResult.overall_grade)}`}>
                <div className="flex flex-col sm:flex-row
                                sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500
                                  uppercase tracking-wide">
                      AI Grade — {assignmentType} on {assignmentTopic}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-6xl font-black
                        ${gradeColor(analysisResult.overall_grade)}`}>
                        {analysisResult.overall_grade}
                      </span>
                      <div>
                        <div className="text-2xl font-extrabold
                                        text-slate-900">
                          {analysisResult.score}/100
                        </div>
                        <span className={`text-xs font-bold px-2.5
                          py-1 rounded-full
                          ${readinessConfig(
                            analysisResult.bar_exam_readiness
                          ).color}`}>
                          {readinessConfig(
                            analysisResult.bar_exam_readiness
                          ).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 min-w-[200px]">
                    {[
                      {
                        label: 'Rule Accuracy',
                        score: analysisResult.rule_accuracy?.score,
                      },
                      {
                        label: 'Analysis Quality',
                        score: analysisResult.analysis_quality?.score,
                      },
                      {
                        label: 'Issue Spotting',
                        score: analysisResult.issue_spotting?.score,
                      },
                      {
                        label: 'Writing Quality',
                        score: analysisResult.writing_quality?.score,
                      },
                    ].map(({ label, score }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs
                                        text-slate-600 mb-0.5">
                          <span>{label}</span>
                          <span className="font-bold">{score}%</span>
                        </div>
                        {scoreBar(score)}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-slate-700 mt-4
                              leading-relaxed border-t
                              border-slate-200/50 pt-4">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card bg-green-50 border
                                border-green-200 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-green-800
                                 uppercase tracking-wide">
                    ✅ Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.strengths?.map((s, i) => (
                      <li key={i}
                        className="flex items-start gap-2
                                   text-sm text-green-900">
                        <span className="text-green-500 shrink-0
                                         mt-0.5 font-bold">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card bg-red-50 border
                                border-red-200 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-red-800
                                 uppercase tracking-wide">
                    ⚠️ Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.weaknesses?.map((w, i) => (
                      <li key={i}
                        className="flex items-start gap-2
                                   text-sm text-red-900">
                        <span className="text-red-500 shrink-0
                                         mt-0.5">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Detailed Category Feedback */}
              <div className="card bg-white border border-slate-200
                              p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-slate-800
                               uppercase tracking-wide">
                  🔍 Detailed Category Feedback
                </h3>
                {[
                  {
                    label: 'Rule Accuracy',
                    data:  analysisResult.rule_accuracy,
                  },
                  {
                    label: 'Analysis Quality',
                    data:  analysisResult.analysis_quality,
                  },
                  {
                    label: 'Issue Spotting',
                    data:  analysisResult.issue_spotting,
                  },
                  {
                    label: 'Writing Quality',
                    data:  analysisResult.writing_quality,
                  },
                ].map(({ label, data }) => data && (
                  <div key={label}
                    className="p-4 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-700
                                    uppercase tracking-wide">
                        {label}
                      </p>
                      <span className={`text-sm font-extrabold
                        ${data.score >= 80 ? 'text-green-600'
                          : data.score >= 60 ? 'text-blue-600'
                          : 'text-amber-600'}`}>
                        {data.score}%
                      </span>
                    </div>
                    {scoreBar(data.score)}
                    <p className="text-xs text-slate-600 mt-1">
                      {data.feedback}
                    </p>
                  </div>
                ))}
              </div>

              {/* Improvements */}
              <div className="card bg-blue-50 border border-blue-200
                              p-5 space-y-3">
                <h3 className="text-sm font-bold text-blue-900
                               uppercase tracking-wide">
                  🚀 How to Improve
                </h3>
                <ol className="space-y-2">
                  {analysisResult.improvements?.map((imp, i) => (
                    <li key={i}
                      className="flex items-start gap-3
                                 text-sm text-blue-900">
                      <span className="w-5 h-5 bg-blue-600 text-white
                                       rounded-full flex items-center
                                       justify-center text-xs font-bold
                                       shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {imp}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Model Answer Hints */}
              {analysisResult.model_answer_hints && (
                <div className="card bg-amber-50 border
                                border-amber-200 p-5 space-y-2">
                  <h3 className="text-sm font-bold text-amber-900
                                 uppercase tracking-wide">
                    📖 What a Perfect Answer Looks Like
                  </h3>
                  <p className="text-sm text-amber-800">
                    {analysisResult.model_answer_hints}
                  </p>
                </div>
              )}

              {/* Recommended Study */}
              {analysisResult.recommended_study?.length > 0 && (
                <div className="card bg-white border border-slate-200
                                p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-800
                                 uppercase tracking-wide">
                    📚 Recommended Study Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.recommended_study.map((topic, i) => (
                      <Link key={i} to="/chat"
                        className="text-xs bg-slate-100 border
                                   border-slate-200 text-slate-700
                                   px-3 py-1.5 rounded-full
                                   hover:bg-blue-50 hover:border-blue-300
                                   hover:text-blue-700 transition-colors
                                   font-medium">
                        📖 {topic}
                      </Link>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link to="/mock-exam"
                      className="flex-1 text-center py-2.5 bg-blue-600
                                 text-white rounded-xl text-sm font-bold
                                 hover:bg-blue-700 transition-colors">
                      📝 Practice These Topics
                    </Link>
                    <Link to="/tutorials"
                      className="flex-1 text-center py-2.5 bg-slate-100
                                 text-slate-700 rounded-xl text-sm
                                 font-bold hover:bg-slate-200
                                 transition-colors">
                      🎥 Watch Tutorials
                    </Link>
                  </div>
                </div>
              )}

              {/* Submit another */}
              <button
                onClick={() => {
                  setAnalysisResult(null)
                  setAssignmentText('')
                  setAssignmentFile(null)
                }}
                className="btn-secondary w-full text-sm">
                ✍️ Submit Another Assignment
              </button>
            </div>
          )}

          {/* Past Assignments */}
          {pastAssignments.length > 0 && !analysisResult && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800
                             uppercase tracking-wide">
                📋 Past Submissions
              </h3>
              <div className="space-y-3">
                {pastAssignments.map((a, i) => {
                  let parsedFeedback = null
                  try {
                    parsedFeedback = JSON.parse(a.feedback)
                  } catch {}

                  return (
                    <details
                      key={a.id || i}
                      className="card bg-white border border-slate-200
                                 hover:border-slate-300 rounded-xl p-0
                                 overflow-hidden transition-all">
                      <summary className="flex items-center
                                          justify-between p-4
                                          cursor-pointer select-none
                                          list-none">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-black
                            ${gradeColor(a.grade)}`}>
                            {a.grade || '?'}
                          </span>
                          <div>
                            <p className="text-sm font-semibold
                                          text-slate-900">
                              {a.topic} — {a.type}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Score: {a.score}/100 •{' '}
                              {a.created_at
                                ? new Date(a.created_at)
                                    .toLocaleDateString()
                                : 'Just now'}
                              {a.file_name && ` • 📎 ${a.file_name}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-slate-400 text-xs
                                         transition-transform">
                          ▼
                        </span>
                      </summary>

                      {parsedFeedback && (
                        <div className="p-4 border-t border-slate-100
                                        bg-slate-50/50 space-y-3">
                          <p className="text-sm text-slate-700">
                            {parsedFeedback.summary}
                          </p>
                          {parsedFeedback.improvements?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold
                                            text-slate-400 uppercase mb-1">
                                Key Improvements:
                              </p>
                              <ul className="space-y-1">
                                {parsedFeedback.improvements
                                  .slice(0, 2)
                                  .map((imp, j) => (
                                    <li key={j}
                                      className="text-xs text-slate-600
                                                 flex items-start gap-1.5">
                                      <span className="text-blue-500
                                                       shrink-0">→</span>
                                      {imp}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </details>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
