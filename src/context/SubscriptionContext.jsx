import {
  createContext, useContext, useState,
  useEffect, useCallback,
} from 'react'
import { supabase } from '../api/client'

// ── Plan definitions ──────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    id:          'free',
    name:        'Free',
    price:       0,
    period:      null,
    color:       'slate',
    badge:       null,
    limits: {
      aiMessages:      10,    // per day
      mockQuestions:   5,     // per day
      studyPlan:       false, // locked
      assignments:     false, // locked
      analytics:       false, // locked
      examSimulation:  false, // locked
      essayGrading:    false, // locked
      blog:            true,  // free
      tutorials:       true,  // free (list only)
      tutorialDetail:  false, // locked — need account but not paid
    },
  },
  pro: {
    id:          'pro',
    name:        'Pro',
    price:       100,
    period:      'month',
    color:       'blue',
    badge:       '🔥 Most Popular',
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    limits: {
      aiMessages:      -1,   // unlimited
      mockQuestions:   -1,   // unlimited
      studyPlan:       true,
      assignments:     true,
      analytics:       true,
      examSimulation:  false,
      essayGrading:    false,
      blog:            true,
      tutorials:       true,
      tutorialDetail:  true,
    },
  },
  barready: {
    id:          'barready',
    name:        'Bar Ready',
    price:       400,
    period:      'year',
    color:       'purple',
    badge:       '👑 Save $800',
    stripePriceId: import.meta.env.VITE_STRIPE_BARREADY_PRICE_ID,
    limits: {
      aiMessages:      -1,
      mockQuestions:   -1,
      studyPlan:       true,
      assignments:     true,
      analytics:       true,
      examSimulation:  true,
      essayGrading:    true,
      blog:            true,
      tutorials:       true,
      tutorialDetail:  true,
    },
  },
}

// ── Context ───────────────────────────────────────────────────────────────────
const SubscriptionContext = createContext(null)

export function SubscriptionProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plan,    setPlan]    = useState('free')

  // ── Load profile ───────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProfile(null)
        setPlan('free')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      const userProfile = data || {
        id:                      user.id,
        plan:                    'free',
        ai_messages_today:       0,
        mock_questions_today:    0,
        ai_messages_reset_at:    new Date().toISOString().split('T')[0],
        mock_questions_reset_at: new Date().toISOString().split('T')[0],
      }

      setProfile(userProfile)
      setPlan(userProfile.plan || 'free')
    } catch (err) {
      console.error('Load profile error:', err)
      setPlan('free')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          loadProfile()
        }
      }
    )
    return () => subscription?.unsubscribe()
  }, [loadProfile])

  // ── Can use feature ────────────────────────────────────────────────────────
  const canUse = useCallback((feature) => {
    const currentPlan = PLANS[plan] || PLANS.free
    const limit = currentPlan.limits[feature]
    if (limit === undefined) return false
    if (limit === true)      return true
    if (limit === false)     return false
    if (limit === -1)        return true
    return true
  }, [plan])

  // ── Check daily limit ──────────────────────────────────────────────────────
  const checkLimit = useCallback((type) => {
    const currentPlan = PLANS[plan] || PLANS.free

    if (!profile) return { allowed: false, remaining: 0, limit: 0 }

    if (type === 'aiMessages') {
      const limit = currentPlan.limits.aiMessages
      if (limit === -1) return { allowed: true, remaining: -1, limit: -1 }

      const today     = new Date().toISOString().split('T')[0]
      const resetDate = profile.ai_messages_reset_at
      const used      = resetDate < today ? 0 : (profile.ai_messages_today || 0)
      const remaining = Math.max(0, limit - used)
      return { allowed: remaining > 0, remaining, limit, used }
    }

    if (type === 'mockQuestions') {
      const limit = currentPlan.limits.mockQuestions
      if (limit === -1) return { allowed: true, remaining: -1, limit: -1 }

      const today     = new Date().toISOString().split('T')[0]
      const resetDate = profile.mock_questions_reset_at
      const used      = resetDate < today ? 0 : (profile.mock_questions_today || 0)
      const remaining = Math.max(0, limit - used)
      return { allowed: remaining > 0, remaining, limit, used }
    }

    return { allowed: true, remaining: -1, limit: -1 }
  }, [plan, profile])

  // ── Increment usage ────────────────────────────────────────────────────────
  const incrementUsage = useCallback(async (type) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    if (type === 'aiMessages') {
      const needsReset = !profile?.ai_messages_reset_at ||
                          profile.ai_messages_reset_at < today
      const newCount = needsReset ? 1 : (profile?.ai_messages_today || 0) + 1

      const { data } = await supabase
        .from('profiles')
        .update({
          ai_messages_today:    newCount,
          ai_messages_reset_at: today,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (data) setProfile(data)
    }

    if (type === 'mockQuestions') {
      const needsReset = !profile?.mock_questions_reset_at ||
                          profile.mock_questions_reset_at < today
      const newCount = needsReset ? 1 : (profile?.mock_questions_today || 0) + 1

      const { data } = await supabase
        .from('profiles')
        .update({
          mock_questions_today:    newCount,
          mock_questions_reset_at: today,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (data) setProfile(data)
    }
  }, [profile])

  const currentPlan = PLANS[plan] || PLANS.free

  return (
    <SubscriptionContext.Provider value={{
      plan,
      profile,
      loading,
      currentPlan,
      canUse,
      checkLimit,
      incrementUsage,
      loadProfile,
      isPro:      plan === 'pro' || plan === 'barready',
      isBarReady: plan === 'barready',
      isFree:     plan === 'free',
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider')
  return ctx
}
