import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

const TOPICS = [
  'All Topics',
  'Constitutional Law',
  'Contracts',
  'Torts',
  'Criminal Law',
  'Civil Procedure',
  'Evidence',
  'Real Property',
  'Business Associations',
  'Family Law',
  'Wills & Trusts',
]

export default function Tutorials() {
  const [modules, setModules]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTopic, setActiveTopic] = useState('All Topics')
  const [error, setError]           = useState('')

  useEffect(() => {
    loadModules()
  }, [activeTopic])

  const loadModules = async () => {
    setLoading(true)
    setError('')
    try {
      const topic = activeTopic === 'All Topics' ? '' : activeTopic
      const res   = await apiClient.getModules(topic, false)
      setModules(res.data.modules || [])
    } catch (err) {
      setError('Failed to load tutorials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Group modules by topic
  const grouped = modules.reduce((acc, module) => {
    const t = module.topic || 'General'
    if (!acc[t]) acc[t] = []
    acc[t].push(module)
    return acc
  }, {})

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Video Tutorials
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          AI-powered bar exam lecture courses.
          Watch videos and ask the AI questions about the content.
        </p>
      </div>

      {/* Topic Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4
                      sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => setActiveTopic(topic)}
            className={`px-4 py-2 rounded-full text-sm font-medium
              whitespace-nowrap transition-colors duration-200 shrink-0
              ${activeTopic === topic
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200
                        rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <LoadingSpinner size="lg" text="Loading tutorials..." />
        </div>
      ) : modules.length === 0 ? (
        <div className="card text-center py-16 space-y-3">
          <div className="text-4xl">📚</div>
          <h2 className="text-lg font-semibold text-slate-900">
            No Tutorials Yet
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Tutorials will appear here once the admin adds
            YouTube lecture videos. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeTopic === 'All Topics' ? (
            // Show grouped by topic
            Object.entries(grouped).map(([topic, topicModules]) => (
              <div key={topic}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {topic}
                  </h2>
                  <span className="badge bg-blue-100 text-blue-700
                                   text-xs px-2 py-0.5">
                    {topicModules.length} video{topicModules.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2
                                lg:grid-cols-3 gap-4">
                  {topicModules.map((module) => (
                    <ModuleCard key={module.id} module={module} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Show flat grid for single topic
            <div className="grid grid-cols-1 sm:grid-cols-2
                            lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ModuleCard({ module }) {
  return (
    <Link
      to={`/tutorials/${module.id}`}
      className="card hover:shadow-md transition-all duration-200
                 hover:-translate-y-0.5 flex flex-col p-0 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative bg-slate-200 aspect-video">
        {module.thumbnail_url ? (
          <img
            src={module.thumbnail_url}
            alt={module.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.parentElement.innerHTML =
                '<div class="w-full h-full flex items-center justify-center"><span class="text-4xl">▶️</span></div>'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">▶️</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20
                        flex items-center justify-center
                        opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full
                          flex items-center justify-center">
            <span className="text-blue-600 text-lg ml-1">▶</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <span className="badge bg-blue-100 text-blue-700
                         text-xs px-2 py-0.5 w-fit mb-2">
          {module.topic}
        </span>
        <h3 className="font-semibold text-slate-900 text-sm
                       line-clamp-2 mb-2">
          {module.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-3 flex-1">
          {module.ai_summary}
        </p>
        <div className="mt-3 flex items-center text-blue-600
                        text-xs font-medium">
          Watch & Learn →
        </div>
      </div>
    </Link>
  )
}
