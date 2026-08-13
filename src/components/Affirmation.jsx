import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import LoadingSpinner from './LoadingSpinner'

const FALLBACK = 'You have the analytical mind and the diligence to conquer this exam. One rule, one analysis, one day at a time.'
const CACHE_KEY = 'barpre_affirmation'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { text, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return text
  } catch {
    return null
  }
}

function setCache(text) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      text,
      timestamp: Date.now()
    }))
  } catch {}
}

export default function Affirmation() {
  const [affirmation, setAffirmation] = useState('')
  const [loading, setLoading]         = useState(true)
  const [isError, setIsError]         = useState(false)
  const [visible, setVisible]         = useState(false)

  const fetchAffirmation = useCallback(async (force = false) => {
    setLoading(true)
    setIsError(false)
    setVisible(false)

    // Use cache unless forced refresh
    if (!force) {
      const cached = getCached()
      if (cached) {
        setAffirmation(cached)
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
        return
      }
    }

    try {
      const res = await apiClient.getAffirmation()
      const text = res.data.affirmation
      setAffirmation(text)
      setCache(text)
    } catch {
      setIsError(true)
      setAffirmation(FALLBACK)
    } finally {
      setLoading(false)
      setTimeout(() => setVisible(true), 50)
    }
  }, [])

  useEffect(() => {
    fetchAffirmation()
  }, [fetchAffirmation])

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">
            Daily Affirmation
          </span>
        </div>

        {/* Refresh button */}
        {!loading && (
          <button
            onClick={() => fetchAffirmation(true)}
            title="Get new affirmation"
            className="text-blue-200 hover:text-white transition-colors text-sm 
                       flex items-center gap-1 hover:bg-blue-500 rounded-lg px-2 py-1"
          >
            <span>↻</span>
            <span className="hidden sm:inline">New</span>
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-3">
          <LoadingSpinner size="sm" />
          <span className="text-blue-200 text-sm">Getting your affirmation...</span>
        </div>
      ) : (
        <div
          className={`transition-all duration-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <p className="text-lg font-medium leading-relaxed">
            "{affirmation}"
          </p>

          {/* Subtle error indicator */}
          {isError && (
            <p className="text-blue-300 text-xs mt-2 flex items-center gap-1">
              <span>⚠</span>
              <span>Showing saved affirmation — tap ↻ to try again</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
