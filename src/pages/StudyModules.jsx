import { useState } from 'react'
import { apiClient } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function StudyModules() {
  const [url, setUrl]         = useState('')
  const [type, setType]       = useState('url')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

  const handleIngest = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setResult(null)
    setError('')

    try {
      const res = type === 'url'
        ? await apiClient.ingestUrl(url)
        : await apiClient.ingestYoutube(url)
      setResult(res.data.message)
      setUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto 
                    px-4 sm:px-6 lg:px-0">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Study Modules
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Add study materials for the AI to learn from.
          Paste a bar prep website URL or a YouTube lecture link.
        </p>
      </div>

      {/* Ingest Form */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          Add Study Material
        </h2>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-4">
          {[
            { value: 'url',     label: '🌐 Website'  },
            { value: 'youtube', label: '▶️ YouTube'  },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={`flex-1 sm:flex-none px-4 py-2.5 
                rounded-lg text-sm font-medium
                transition-colors duration-200
                ${type === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* URL Input */}
        <form onSubmit={handleIngest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium 
                               text-slate-700 mb-1.5">
              {type === 'url' ? 'Website URL' : 'YouTube URL'}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                type === 'url'
                  ? 'https://www.law.cornell.edu/wex/tort'
                  : 'https://www.youtube.com/watch?v=...'
              }
              className="input-field text-sm sm:text-base"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary w-full min-h-[44px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Processing...
              </span>
            ) : (
              `Add ${type === 'url' ? 'Website' : 'YouTube Video'}`
            )}
          </button>
        </form>

        {/* Success */}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border 
                          border-green-200 rounded-lg 
                          text-green-700 text-sm">
            ✅ {result}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border 
                          border-red-200 rounded-lg 
                          text-red-700 text-sm">
            <p className="font-medium mb-1">❌ Failed to process</p>
            <p>{error}</p>
            {(error.includes('429') || 
              error.includes('rate limit') ||
              error.includes('Too Many')) && (
              <p className="mt-2 text-amber-700 bg-amber-50 
                            border border-amber-200 rounded p-2">
                ⏳ YouTube is rate limiting requests.
                Please wait 5 minutes and try again.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tips Card */}
      <div className="card bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-3">
          💡 Tips For Best Results
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          {[
            'Add Cornell Law pages like law.cornell.edu/wex/tort',
            'Add YouTube bar prep lecture videos for AI coaching',
            'After adding materials ask the AI Coach questions',
            'YouTube videos must have captions enabled',
            'Wait 30 seconds between each URL submission',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5 shrink-0">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}
