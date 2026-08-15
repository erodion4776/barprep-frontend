import { Link }            from 'react-router-dom'
import { useSubscription } from '../context/SubscriptionContext'

// ── Upgrade prompt configs ────────────────────────────────────────────────────
const CONFIGS = {
  aiMessages: {
    icon:  '🤖',
    title: "You've used all 10 AI messages today!",
    desc:  'Upgrade to Pro for unlimited AI coaching sessions.',
    badge: 'Resets tomorrow at midnight',
  },
  mockQuestions: {
    icon:  '📝',
    title: "You've used all 5 mock questions today!",
    desc:  'Upgrade to Pro for unlimited practice exams.',
    badge: 'Resets tomorrow at midnight',
  },
  studyPlan: {
    icon:  '📅',
    title: 'Study Plan is a Pro feature',
    desc:  'Upgrade to Pro to get your personalized day-by-day study plan.',
    badge: 'Pro feature',
  },
  assignments: {
    icon:  '✍️',
    title: 'Assignment Grading is a Pro feature',
    desc:  'Upgrade to Pro to submit essays and get instant AI feedback.',
    badge: 'Pro feature',
  },
  analytics: {
    icon:  '📊',
    title: 'Advanced Analytics is a Pro feature',
    desc:  'Upgrade to Pro to see your full performance breakdown.',
    badge: 'Pro feature',
  },
  tutorialDetail: {
    icon:  '🎥',
    title: 'Full Tutorial Access is a Pro feature',
    desc:  'Upgrade to Pro to watch full lectures with AI coaching.',
    badge: 'Pro feature',
  },
  examSimulation: {
    icon:  '🎓',
    title: 'Exam Simulation is a Bar Ready feature',
    desc:  'Get Bar Ready for a full simulated bar exam experience.',
    badge: 'Bar Ready only',
  },
  essayGrading: {
    icon:  '📖',
    title: 'MEE Essay Grading is a Bar Ready feature',
    desc:  'Get Bar Ready for full MEE essay grading and feedback.',
    badge: 'Bar Ready only',
  },
}

// ── Inline banner variant ─────────────────────────────────────────────────────
export function UpgradeBanner({ feature }) {
  const config = CONFIGS[feature] || {
    icon:  '⭐',
    title: 'This is a premium feature',
    desc:  'Upgrade to unlock this feature.',
    badge: 'Premium',
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50
                    border border-blue-200 rounded-2xl p-5
                    flex flex-col sm:flex-row items-start sm:items-center
                    justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{config.icon}</span>
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-bold text-slate-900">{config.title}</p>
            <span className="text-[10px] bg-blue-100 text-blue-700
                             px-2 py-0.5 rounded-full font-bold">
              {config.badge}
            </span>
          </div>
          <p className="text-xs text-slate-500">{config.desc}</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
        <Link
          to="/pricing"
          className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white
                     text-xs font-bold rounded-xl hover:bg-blue-700
                     transition-colors text-center"
        >
          Upgrade to Pro →
        </Link>
        <Link
          to="/pricing"
          className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white
                     text-xs font-bold rounded-xl hover:bg-purple-700
                     transition-colors text-center"
        >
          Bar Ready $400/yr
        </Link>
      </div>
    </div>
  )
}

// ── Modal overlay variant ─────────────────────────────────────────────────────
export function UpgradeModal({ feature, onClose }) {
  const config = CONFIGS[feature] || {
    icon:  '⭐',
    title: 'Premium Feature',
    desc:  'Upgrade to unlock this feature.',
    badge: 'Premium',
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center
                    justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full
                      space-y-5 shadow-2xl">

        <div className="text-center space-y-3">
          <div className="text-5xl">{config.icon}</div>
          <div>
            <span className="text-[10px] bg-blue-100 text-blue-700
                             px-2.5 py-1 rounded-full font-bold">
              {config.badge}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900">{config.title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{config.desc}</p>
        </div>

        {/* Plan options */}
        <div className="space-y-3">
          <Link
            to="/pricing"
            className="block w-full py-3.5 bg-blue-600 text-white font-black
                       text-sm text-center rounded-2xl hover:bg-blue-700
                       transition-colors"
          >
            🚀 Pro Plan — $100/month
          </Link>
          <Link
            to="/pricing"
            className="block w-full py-3.5 bg-purple-600 text-white font-black
                       text-sm text-center rounded-2xl hover:bg-purple-700
                       transition-colors"
          >
            👑 Bar Ready — $400/year (Save $800)
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="block w-full py-3 border border-slate-200 text-slate-500
                         text-sm rounded-2xl hover:bg-slate-50 transition-colors"
            >
              Maybe later
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Free plan resets daily • Cancel anytime
        </p>
      </div>
    </div>
  )
}

// ── Default export (modal) ────────────────────────────────────────────────────
export default function UpgradePrompt({ feature, onClose }) {
  return <UpgradeModal feature={feature} onClose={onClose} />
}
