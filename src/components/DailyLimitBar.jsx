import { Link } from 'react-router-dom'

export default function DailyLimitBar({ type, checkLimit }) {
  const check = checkLimit(type)

  if (check.limit === -1) return null // unlimited — don't show

  const pct     = Math.min(((check.used || 0) / check.limit) * 100, 100)
  const isEmpty = check.remaining === 0
  const isLow   = check.remaining <= 2 && check.remaining > 0

  const labels = {
    aiMessages:    { label: 'AI messages',    icon: '🤖' },
    mockQuestions: { label: 'mock questions', icon: '📝' },
  }
  const { label, icon } = labels[type] || { label: 'uses', icon: '⭐' }

  return (
    <div className={`px-4 py-2 border-b flex items-center gap-3
      ${isEmpty ? 'bg-red-50 border-red-200'
        : isLow  ? 'bg-amber-50 border-amber-200'
        : 'bg-slate-50 border-slate-200'
      }`}>
      <span className="text-sm shrink-0">{icon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-xs font-medium
            ${isEmpty ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-slate-600'}`}>
            {isEmpty
              ? `No ${label} left today`
              : `${check.remaining} / ${check.limit} ${label} remaining`
            }
          </span>
          <span className="text-[10px] text-slate-400">Resets midnight UTC</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300
              ${isEmpty ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <Link
        to="/pricing"
        className={`shrink-0 text-[10px] font-bold px-2.5 py-1
                    rounded-full transition-colors whitespace-nowrap
          ${isEmpty
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
      >
        Upgrade →
      </Link>
    </div>
  )
}
