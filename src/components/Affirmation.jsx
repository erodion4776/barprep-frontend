import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import LoadingSpinner from './LoadingSpinner'

export default function Affirmation() {
  const [affirmation, setAffirmation] = useState('')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)

  useEffect(() => {
    const fetchAffirmation = async () => {
      try {
        const res = await apiClient.getAffirmation()
        setAffirmation(res.data.affirmation)
      } catch {
        setError(true)
        setAffirmation(
          'You have the analytical mind and the diligence to conquer this exam. One rule, one analysis, one day at a time.'
        )
      } finally {
        setLoading(false)
      }
    }
    fetchAffirmation()
  }, [])

  return (
    <div className="bg-blue-600 rounded-xl p-6 text-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">
          Daily Affirmation
        </span>
      </div>

      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <p className="text-lg font-medium leading-relaxed">
          "{affirmation}"
        </p>
      )}
    </div>
  )
}
