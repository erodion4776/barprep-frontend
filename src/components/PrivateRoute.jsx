import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../api/client'
import LoadingSpinner from './LoadingSpinner'

export default function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner /></div>
  }

  return user ? children : <Navigate to="/login" />
}
