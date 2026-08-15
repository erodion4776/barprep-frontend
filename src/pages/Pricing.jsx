import { useState, useEffect }    from 'react'
import { Link, useNavigate }      from 'react-router-dom'
import { supabase }               from '../api/client'
import { PLANS }                  from '../context/SubscriptionContext'
import { useSubscription }        from '../context/SubscriptionContext'
import LoadingSpinner             from '../components/LoadingSpinner'

// ── Stripe checkout ───────────────────────────────────────────────────────────
async function createCheckoutSession(priceId, userId, userEmail) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
    {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl:  `${window.location.origin}/pricing`,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to create checkout session')
  }

  return response.json()
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({ planKey, plan, currentPlan, onSelect, loading, user }) {
  const isCurrentPlan = currentPlan === planKey
  const isFree        = planKey === 'free'
  const isPro         = planKey === 'pro'
  const isBarReady    = planKey === 'barready'

  const features = {
    free: [
      { text: '10 AI messages per day',           included: true  },
      { text: '5 mock exam questions per day',     included: true  },
      { text: 'Blog access',                       included: true  },
      { text: 'Video tutorials',                   included: true  },
      { text: 'Basic progress tracking',           included: true  },
      { text: 'Personalized study plan',           included: false },
      { text: 'Assignment AI grading',             included: false },
      { text: 'Advanced analytics',                included: false },
      { text: 'Unlimited mock exams',              included: false },
      { text: 'Priority support',                  included: false },
    ],
    pro: [
      { text: 'Unlimited AI coaching sessions',    included: true  },
      { text: 'Unlimited mock exam questions',     included: true  },
      { text: 'Personalized study plan',           included: true  },
      { text: 'Assignment AI grading & feedback',  included: true  },
      { text: 'Full progress analytics',           included: true  },
      { text: 'All video tutorials',               included: true  },
      { text: 'Blog access',                       included: true  },
      { text: 'Priority email support',            included: true  },
      { text: 'Cancel anytime',                    included: true  },
      { text: 'Exam simulation',                   included: false },
    ],
    barready: [
      { text: 'Everything in Pro',                 included: true  },
      { text: 'Full year access (best value)',     included: true  },
      { text: 'Simulated full bar exam',           included: true  },
      { text: 'MEE essay grading',                 included: true  },
      { text: 'Personalized weakness drills',      included: true  },
      { text: 'Exam day readiness report',         included: true  },
      { text: 'Priority support',                  included: true  },
      { text: 'Early access to new features',      included: true  },
      { text: 'Pass guarantee or money back',      included: true  },
      { text: 'Save $800 vs monthly Pro',          included: true  },
    ],
  }

  const borderColor = {
    free:     'border-slate-200',
    pro:      'border-blue-500',
    barready: 'border-purple-500',
  }

  const buttonStyle = {
    free:     isCurrentPlan
                ? 'bg-slate-100 text-slate-500 cursor-default'
                : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    pro:      isCurrentPlan
                ? 'bg-blue-100 text-blue-500 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200',
    barready: isCurrentPlan
                ? 'bg-purple-100 text-purple-500 cursor-default'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200',
  }

  return (
    <div className={`
      relative border-2 rounded-3xl p-7 space-y-6
      transition-all duration-300 flex flex-col
      ${borderColor[planKey]}
      ${isPro ? 'shadow-2xl shadow-blue-100 scale-105' : 'hover:shadow-lg'}
      ${isBarReady ? 'shadow-xl shadow-purple-100' : ''}
    `}>
      {/* Badge */}
      {plan.badge && (
        <div className={`
          absolute -top-4 left-1/2 -translate-x-1/2
          text-white text-xs font-black px-4 py-1.5
          rounded-full whitespace-nowrap shadow-lg
          ${isPro ? 'bg-blue-600' : 'bg-purple-600'}
        `}>
          {plan.badge}
        </div>
      )}

      {/* Current plan indicator */}
      {isCurrentPlan && (
        <div className="absolute -top-4 right-4 bg-green-500 text-white
                        text-xs font-bold px-3 py-1 rounded-full">
          ✓ Your Plan
        </div>
      )}

      {/* Plan info */}
      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>

        <div className="flex items-end gap-1">
          <span className="text-5xl font-black text-slate-900">
            ${plan.price}
          </span>
          {plan.period && (
            <span className="text-slate-500 text-sm mb-2">
              /{plan.period}
            </span>
          )}
        </div>

        {/* Savings callout for barready */}
        {isBarReady && (
          <div className="bg-purple-50 border border-purple-200
                          rounded-xl p-2 text-center">
            <p className="text-xs font-bold text-purple-700">
              🎉 Save $800 vs paying monthly!
            </p>
            <p className="text-[10px] text-purple-500">
              ($100 × 12 months = $1,200 vs $400/year)
            </p>
          </div>
        )}

        {isFree && (
          <p className="text-xs text-slate-500">Forever free — no credit card</p>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={() => !isCurrentPlan && onSelect(planKey)}
        disabled={isCurrentPlan || loading === planKey}
        className={`
          w-full py-3.5 rounded-2xl text-sm font-black
          transition-all duration-200 hover:-translate-y-0.5
          flex items-center justify-center gap-2
          ${buttonStyle[planKey]}
        `}
      >
        {loading === planKey ? (
          <>
            <LoadingSpinner size="sm" color={isFree ? 'blue' : 'white'} />
            Redirecting…
          </>
        ) : isCurrentPlan ? (
          '✓ Current Plan'
        ) : isFree ? (
          user ? 'Downgrade to Free' : 'Get Started Free'
        ) : isPro ? (
          'Start Pro — $100/mo →'
        ) : (
          'Go Bar Ready — $400/yr →'
        )}
      </button>

      {/* Features */}
      <ul className="space-y-2.5 flex-1">
        {features[planKey].map(({ text, included }) => (
          <li key={text}
              className={`flex items-start gap-2.5 text-xs
                ${included ? 'text-slate-700' : 'text-slate-300'}`}>
            <span className={`shrink-0 mt-0.5 font-bold text-sm
              ${included ? 'text-green-500' : 'text-slate-200'}`}>
              {included ? '✓' : '✗'}
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Usage meter ───────────────────────────────────────────────────────────────
function UsageMeter({ used, limit, label, color = 'blue' }) {
  if (limit === -1) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">{label}</span>
          <span className="text-green-600 font-bold">Unlimited ∞</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full w-full" />
        </div>
      </div>
    )
  }

  const pct        = Math.min((used / limit) * 100, 100)
  const remaining  = Math.max(0, limit - used)
  const isLow      = pct >= 80
  const isEmpty    = pct >= 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className={`font-bold ${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-700'}`}>
          {isEmpty ? '0 left — upgrade!' : `${remaining} / ${limit} left`}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300
            ${isEmpty ? 'bg-red-500' : isLow ? 'bg-amber-500' : `bg-${color}-500`}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Main Pricing Page ─────────────────────────────────────────────────────────
export default function Pricing() {
  const navigate                     = useNavigate()
  const { plan, profile, loadProfile } = useSubscription()
  const [user,    setUser]           = useState(null)
  const [loading, setLoading]        = useState(null)
  const [error,   setError]          = useState('')
  const [success, setSuccess]        = useState('')

  useEffect(() => {
    document.title = 'Pricing — BarPrep AI'
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  const handleSelectPlan = async (planKey) => {
    // Free plan — no payment needed
    if (planKey === 'free') {
      if (!user) { navigate('/signup'); return }
      // Downgrade to free
      const { error: err } = await supabase
        .from('profiles')
        .update({
          plan:   'free',
          stripe_subscription_id: null,
        })
        .eq('id', user.id)
      if (!err) {
        setSuccess('Downgraded to Free plan.')
        loadProfile()
      }
      return
    }

    // Paid plan — redirect to Stripe
    if (!user) {
      navigate('/signup', { state: { from: '/pricing' } })
      return
    }

    setLoading(planKey)
    setError('')

    try {
      const planData = PLANS[planKey]
      if (!planData.stripePriceId) {
        throw new Error('Payment system not configured yet. Please contact support.')
      }

      const { url } = await createCheckoutSession(
        planData.stripePriceId,
        user.id,
        user.email
      )

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err) {
      setError(err.message)
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">

      {/* ── Header ── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5
                        bg-blue-50 border border-blue-200 rounded-full
                        text-blue-700 text-xs font-bold">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          Simple, Transparent Pricing
        </div>
        <h1 className="text-4xl font-black text-slate-900">
          Choose Your Plan
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Start free. Upgrade when you're ready.
          Cancel anytime. No hidden fees.
        </p>

        {/* Savings callout */}
        <div className="inline-flex items-center gap-2 bg-green-50 border
                        border-green-200 rounded-xl px-4 py-2 text-sm">
          <span className="text-green-600 font-bold">💰 Bar Ready saves you $800/year</span>
          <span className="text-green-500 text-xs">vs paying monthly</span>
        </div>
      </div>

      {/* ── Error / Success ── */}
      {error && (
        <div className="max-w-xl mx-auto p-4 bg-red-50 border border-red-200
                        rounded-xl text-red-700 text-sm text-center">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="max-w-xl mx-auto p-4 bg-green-50 border border-green-200
                        rounded-xl text-green-700 text-sm text-center">
          ✅ {success}
        </div>
      )}

      {/* ── Current usage (logged in users) ── */}
      {user && profile && (
        <div className="max-w-lg mx-auto bg-white border border-slate-200
                        rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Your Daily Usage
            </h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full
              ${plan === 'free'     ? 'bg-slate-100 text-slate-600'   : ''}
              ${plan === 'pro'      ? 'bg-blue-100 text-blue-700'     : ''}
              ${plan === 'barready' ? 'bg-purple-100 text-purple-700' : ''}
            `}>
              {PLANS[plan]?.name || 'Free'} Plan
            </span>
          </div>
          <UsageMeter
            label="AI Coach Messages"
            used={profile.ai_messages_today || 0}
            limit={PLANS[plan]?.limits?.aiMessages || 10}
            color="blue"
          />
          <UsageMeter
            label="Mock Exam Questions"
            used={profile.mock_questions_today || 0}
            limit={PLANS[plan]?.limits?.mockQuestions || 5}
            color="green"
          />
          {plan === 'free' && (
            <p className="text-xs text-slate-400 text-center">
              Usage resets daily at midnight UTC
            </p>
          )}
        </div>
      )}

      {/* ── Plan cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {Object.entries(PLANS).map(([key, planData]) => (
          <PlanCard
            key={key}
            planKey={key}
            plan={planData}
            currentPlan={plan}
            onSelect={handleSelectPlan}
            loading={loading}
            user={user}
          />
        ))}
      </div>

      {/* ── Comparison table ── */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 text-center">
          Full Feature Comparison
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-left p-4 font-bold rounded-tl-2xl">Feature</th>
                <th className="text-center p-4 font-bold text-slate-300">Free</th>
                <th className="text-center p-4 font-bold text-blue-400">Pro $100/mo</th>
                <th className="text-center p-4 font-bold text-purple-400 rounded-tr-2xl">Bar Ready $400/yr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['AI Coach Messages',           '10/day',     'Unlimited',  'Unlimited'  ],
                ['Mock Exam Questions',          '5/day',      'Unlimited',  'Unlimited'  ],
                ['Personalized Study Plan',      '❌',          '✅',         '✅'         ],
                ['Assignment AI Grading',        '❌',          '✅',         '✅'         ],
                ['Advanced Analytics',           '❌',          '✅',         '✅'         ],
                ['Video Tutorials',              '✅',          '✅',         '✅'         ],
                ['Blog Access',                  '✅',          '✅',         '✅'         ],
                ['Simulated Full Bar Exam',      '❌',          '❌',         '✅'         ],
                ['MEE Essay Grading',            '❌',          '❌',         '✅'         ],
                ['Exam Readiness Report',        '❌',          '❌',         '✅'         ],
                ['Priority Support',             '❌',          '✅',         '✅'         ],
                ['Pass Guarantee',               '❌',          '❌',         '✅'         ],
                ['Total Cost (3 months)',        '$0',         '$300',       '$400'       ],
              ].map(([feat, free, pro, barready], i) => (
                <tr key={feat}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="p-4 font-medium text-slate-700">{feat}</td>
                  <td className="p-4 text-center text-slate-500">{free}</td>
                  <td className="p-4 text-center text-blue-700 font-semibold bg-blue-50/30">
                    {pro}
                  </td>
                  <td className="p-4 text-center text-purple-700 font-semibold bg-purple-50/30">
                    {barready}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl font-black text-slate-900 text-center">
          Common Questions
        </h2>
        {[
          {
            q: 'Can I cancel anytime?',
            a: 'Yes. Cancel from your settings page anytime. You keep access until the end of your billing period.',
          },
          {
            q: 'What happens when I hit my free daily limit?',
            a: 'You\'ll see a friendly prompt to upgrade. Your limit resets every day at midnight UTC.',
          },
          {
            q: 'Is the $400 Bar Ready plan really for the whole year?',
            a: 'Yes! One payment of $400 gives you full access for 12 months. That\'s like getting 4 months free compared to the monthly Pro plan.',
          },
          {
            q: 'What is the pass guarantee?',
            a: 'Bar Ready students who follow the AI study plan and don\'t pass can request a full refund. Contact support@barprepai.com within 30 days of your exam results.',
          },
          {
            q: 'Can I upgrade from Free to Pro or Bar Ready anytime?',
            a: 'Absolutely. Upgrade anytime from this page or from your settings. Your account unlocks instantly after payment.',
          },
        ].map(({ q, a }) => (
          <div key={q}
               className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
            <p className="font-bold text-slate-900 text-sm">{q}</p>
            <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      {/* ── Bottom CTA ── */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700
                      rounded-3xl p-8 text-center text-white space-y-4">
        <h2 className="text-2xl font-black">
          Ready to Pass the Bar?
        </h2>
        <p className="text-blue-100 text-sm max-w-md mx-auto">
          Start free today. Upgrade when you're ready.
          Join students studying smarter with AI.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          {!user ? (
            <>
              <Link
                to="/signup"
                className="px-8 py-3 bg-white text-blue-700 font-black
                           rounded-2xl hover:bg-blue-50 transition-colors"
              >
                Start Free →
              </Link>
              <button
                onClick={() => handleSelectPlan('pro')}
                className="px-8 py-3 bg-blue-500 text-white font-black
                           rounded-2xl hover:bg-blue-400 transition-colors
                           border border-blue-400"
              >
                Go Pro — $100/mo
              </button>
            </>
          ) : (
            <button
              onClick={() => handleSelectPlan(plan === 'free' ? 'pro' : 'barready')}
              className="px-10 py-3 bg-white text-blue-700 font-black
                         rounded-2xl hover:bg-blue-50 transition-colors"
            >
              {plan === 'free' ? 'Upgrade to Pro →' : 'Upgrade to Bar Ready →'}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
