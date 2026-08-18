import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect }   from 'react'
import { supabase }              from '../api/client'
import LoadingSpinner            from './LoadingSpinner'

export default function PrivateRoute({
  children,
  adminOnly = false,
}) {
  const location = useLocation()

  const [loading,   setLoading]   = useState(true)
  const [user,      setUser]      = useState(null)
  const [isAdmin,   setIsAdmin]   = useState(false)
  const [isBanned,  setIsBanned]  = useState(false)
  const [banReason, setBanReason] = useState('')

  const checkAdmin = (u) => {
    if (!u) return false
    return !!u.user_metadata?.is_admin
  }

  useEffect(() => {
    const checkAuth = async () => {
      // Get session
      const { data: { session } } = await supabase.auth.getSession()
      const u = session?.user ?? null
      setUser(u)
      setIsAdmin(checkAdmin(u))

      // Check if user is banned
      if (u) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_active, ban_reason')
            .eq('id', u.id)
            .single()

          if (profile?.is_active === false) {
            setIsBanned(true)
            setBanReason(
              profile.ban_reason ||
              'Your account has been deactivated. Contact support@barprepai.com'
            )
            // Sign the user out
            await supabase.auth.signOut()
          }
        } catch {
          // Silent — profile check is non-critical
        }
      }

      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null
        setUser(u)
        setIsAdmin(checkAdmin(u))

        if (event === 'SIGNED_OUT') {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center
                      justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-500 animate-pulse">
          Checking your session...
        </p>
      </div>
    )
  }

  // ── Banned user → redirect to login with ban message ────────────────────────
  if (isBanned) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          error: banReason,
          banned: true,
        }}
      />
    )
  }

  // ── Not logged in → redirect to login ───────────────────────────────────────
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  // ── Admin-only route but user is not admin ──────────────────────────────────
  if (adminOnly && !isAdmin) {
    return (
      <Navigate
        to="/"
        replace
        state={{ error: 'You do not have permission to access that page.' }}
      />
    )
  }

  // ── Authorized ──────────────────────────────────────────────────────────────
  return children
}
