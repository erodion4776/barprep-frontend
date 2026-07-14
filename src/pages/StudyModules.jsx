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
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1>Study Modules</h1>
        <p className="text-slate-500 mt-1">
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
            { value: 'url',     label: '🌐 Website URL'      },
            { value: 'youtube', label: '▶️ YouTube Video'    },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium
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
                  ? 'https://www.example-barprep.com/torts'
                  : 'https://www.youtube.com/watch?v=...'
              }
              className="input-field"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary w-full"
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
          <div className="mt-4 p-4 bg-green-50 border border-green-200 
                          rounded-lg text-green-700 text-sm">
            ✅ {result}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 
                          rounded-lg text-red-700 text-sm">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Tips Card */}
      <div className="card bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-3">
          💡 Tips For Best Results
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            Add bar prep websites like Themis, Barbri outlines, 
            or legal study guides
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            Add YouTube bar prep lecture videos for the AI 
            to use as coaching material
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            After adding materials go to AI Coach and ask 
            questions about the topics you added
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            YouTube videos must have captions enabled 
            for transcription to work
          </li>
        </ul>
      </div>

    </div>
  )
}
