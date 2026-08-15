import { Link }            from 'react-router-dom'
import { useSubscription } from '../context/SubscriptionContext'

export default function UpgradePrompt({
  feature = 'this feature',
  type    = 'modal',
}) {
  const { plan, checkLimit } = useSubscription()

  const messages = {
    aiMessages: {
      title:  "You've used all your AI messages today! 🤖",
      desc:   "Upgrade to Pro for unlimited AI coaching sessions.",
      icon:   '🤖',
    },
    mockQuestions: {
      title:  "You've used all your mock questions today! 📝",
      desc:   "Upgrade to Pro for unlimited practice exams.",
      icon:   '📝',
    },
    studyPlan: {
      title:  "Study Plan is a Pro feature! 📅",
      desc:   "Upgrade to Pro to get your personalized day-by-day study plan.",
      icon:   '📅',
    },
    assignments: {
      title:  "Assignment grading is a Pro feature! ✍️",
      desc:   "Upgrade to Pro to submit essays and get AI feedback.",
      icon:   '✍️',
    },
    analytics: {
      title:  "Advanced analytics is a Pro feature! 📊",
      desc:   "Upgrade to Pro to see your full performance breakdown.",
      icon:   '📊',
    },
    examSimulation: {
      title:  "Full exam simulation is Bar Ready only! 🎓",
      desc:   "Get the Bar Ready plan for a full simulated bar exam experience.",
      icon:   '🎓',
    },
  }

  const msg = messages[feature] || {
    title: `${feature} is a premium feature!`,
    desc:  'Upgrade to unlock this feature.',
    icon:  '⭐',
  }

  if (type === 'banner') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4
                      flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{msg.icon}</span>
          <div>
            <p className="text-sm font-bold text-amber-900">{msg.title}</p>
            <p className="text-xs text-amber-700">{msg.desc}</p>
          </div>
        </div>
        <Link
          to="/pricing"
          className="shrink-0 px-4 py-2 bg-amber-600 text-white text-xs
                     font-bold rounded-xl hover:bg-amber-700 transition-colors"
        >
          Upgrade →
        </Link>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full
                      space-y-5 shadow-2xl">
        <div className="text-center space-y-3">
          <div className="text-5xl">{msg.icon}</div>
          <h2 className="text-xl font-black text-slate-900">{msg.title}</h2>
          <p className="text-slate-500 text-sm">{msg.desc}</p>
        </div>

        <div className="space-y-3">
          <Link
            to="/pricing"
            className="block w-full py-3 bg-blue-600 text-white font-black
                       text-center rounded-2xl hover:bg-blue-700 transition-colors"
          >
            See Plans & Pricing →
          </Link>
          <Link
            to="/pricing"
            className="block w-full py-3 bg-purple-600 text-white font-black
                       text-center rounded-2xl hover:bg-purple-700 transition-colors"
          >
            👑 Bar Ready — $400/year
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400">
          Free plan resets daily at midnight UTC
        </p>
      </div>
    </div>
  )
}
