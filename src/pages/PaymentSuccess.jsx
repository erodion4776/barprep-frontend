import { useEffect, useState } from 'react'
import { Link }                from 'react-router-dom'
import { useSubscription }     from '../context/SubscriptionContext'
import { PLANS }               from '../context/SubscriptionContext'
import LoadingSpinner          from '../components/LoadingSpinner'

export default function PaymentSuccess() {
  const { loadProfile, plan } = useSubscription()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Payment Successful — BarPrep AI'
    // Wait for webhook to process then reload profile
    const timer = setTimeout(async () => {
      await loadProfile()
      setLoading(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [loadProfile])

  const currentPlan = PLANS[plan] || PLANS.free

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl
                          p-10 space-y-4">
            <LoadingSpinner size="lg" text="Activating your plan..." />
            <p className="text-slate-400 text-xs">
              This takes just a few seconds…
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl
                          p-10 space-y-6 shadow-xl">
            <div className="text-6xl">🎉</div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900">
                Welcome to {currentPlan.name}!
              </h1>
              <p className="text-slate-500 text-sm">
                Your payment was successful. Your account has been upgraded
                and all features are now unlocked.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border-2 space-y-1
              ${plan === 'pro'      ? 'bg-blue-50 border-blue-200'     : ''}
              ${plan === 'barready' ? 'bg-purple-50 border-purple-200' : ''}
            `}>
              <p className={`text-sm font-bold
                ${plan === 'pro'      ? 'text-blue-800'   : ''}
                ${plan === 'barready' ? 'text-purple-800' : ''}
              `}>
                ✅ {currentPlan.name} Plan Activated
              </p>
              <p className={`text-xs
                ${plan === 'pro'      ? 'text-blue-600'   : ''}
                ${plan === 'barready' ? 'text-purple-600' : ''}
              `}>
                {plan === 'barready'
                  ? 'Full year access • All features unlocked • Pass guarantee included'
                  : 'Unlimited access • All features unlocked • Cancel anytime'
                }
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/chat"
                className="block w-full py-3 bg-blue-600 text-white font-black
                           rounded-2xl hover:bg-blue-700 transition-colors"
              >
                🤖 Start with AI Coach →
              </Link>
              <Link
                to="/mock-exam"
                className="block w-full py-3 border border-slate-200 text-slate-600
                           font-bold rounded-2xl hover:bg-slate-50 transition-colors"
              >
                📝 Take a Mock Exam
              </Link>
              <Link
                to="/study"
                className="block w-full py-3 border border-slate-200 text-slate-600
                           font-bold rounded-2xl hover:bg-slate-50 transition-colors"
              >
                📅 Generate Study Plan
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              A receipt has been sent to your email.
              Questions?{' '}
              <Link to="/contact" className="text-blue-600 hover:underline">
                Contact support
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
