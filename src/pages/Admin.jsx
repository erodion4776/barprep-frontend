import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

const TOPICS = [
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

const TABS = ['Videos', 'Web Pages', 'PDF Upload', 'Modules']

export default function Admin() {
  const navigate               = useNavigate()
  const [activeTab, setActiveTab] = useState('Videos')
  const [loading, setLoading]  = useState(false)
  const [result, setResult]    = useState('')
  const [error, setError]      = useState('')

  // Video form
  const [videoUrl, setVideoUrl]     = useState('')
  const [videoTopic, setVideoTopic] = useState(TOPICS[0])
  const [videoOrder, setVideoOrder] = useState(0)

  // Web page form
  const [pageUrl, setPageUrl]       = useState('')

  // PDF form
  const [pdfFile, setPdfFile]       = useState(null)
  const [uploading, setUploading]   = useState(false)

  // Modules list
  const [modules, setModules]       = useState([])
  const [loadingModules, setLoadingModules] = useState(false)

  // Check admin auth on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login')
      return
    }
    // Verify token
    apiClient.adminVerify(token).then(res => {
      if (!res.data.valid) {
        localStorage.removeItem('admin_token')
        navigate('/admin/login')
      }
    }).catch(() => {
      navigate('/admin/login')
    })
  }, [])

  // Load modules when tab changes
  useEffect(() => {
    if (activeTab === 'Modules') loadModules()
  }, [activeTab])

  const loadModules = async () => {
    setLoadingModules(true)
    try {
      const res = await apiClient.getModules('', true)
      setModules(res.data.modules || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingModules(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  const handleVideoSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult('')
    setError('')

    try {
      const res = await apiClient.processVideo(
        videoUrl,
        videoTopic,
        videoOrder
      )
      setResult(res.data.message || 'Video processed successfully!')
      setVideoUrl('')
      setVideoOrder(prev => prev + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePageSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult('')
    setError('')

    try {
      const res = await apiClient.ingestUrl(pageUrl)
      setResult(res.data.message || 'Page ingested successfully!')
      setPageUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePdfUpload = async (e) => {
    e.preventDefault()
    if (!pdfFile) return

    setUploading(true)
    setResult('')
    setError('')

    try {
      // 1. Get Supabase client for storage upload
      const { createClient } = await import(
        'https://esm.sh/@supabase/supabase-js@2'
      )
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      )

      const filename    = pdfFile.name
      const storagePath = `pdfs/${Date.now()}_${filename}`

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(storagePath, pdfFile)

      if (uploadError) throw new Error(uploadError.message)

      // 3. Save document record
      const { data: docData, error: docError } = await supabase
        .from('user_documents')
        .insert({
          filename,
          file_type: pdfFile.type,
          file_size: pdfFile.size,
          storage_path: storagePath,
          is_indexed: false
        })
        .select()
        .single()

      if (docError) throw new Error(docError.message)

      // 4. Process PDF in edge function
      const res = await apiClient.processPdf(
        storagePath,
        filename,
        docData.id
      )

      setResult(res.data.message || 'PDF uploaded and indexed successfully!')
      setPdfFile(null)
      e.target.reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage course content for BarPrep AI
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="btn-secondary text-sm"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg
                      overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setResult('')
              setError('')
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium
              whitespace-nowrap transition-colors duration-200 flex-1
              ${activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Result / Error */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200
                        rounded-lg text-green-700 text-sm">
          ✅ {result}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200
                        rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Tab: Videos */}
      {activeTab === 'Videos' && (
        <div className="card space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add YouTube Lecture
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              AI will extract transcript create course module
              generate summary and outline automatically
            </p>
          </div>

          <form onSubmit={handleVideoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium
                                 text-slate-700 mb-1.5">
                YouTube URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="input-field"
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium
                                   text-slate-700 mb-1.5">
                  Topic / Subject
                </label>
                <select
                  value={videoTopic}
                  onChange={(e) => setVideoTopic(e.target.value)}
                  className="input-field"
                  disabled={loading}
                >
                  {TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium
                                   text-slate-700 mb-1.5">
                  Order Index
                </label>
                <input
                  type="number"
                  value={videoOrder}
                  onChange={(e) => setVideoOrder(Number(e.target.value))}
                  className="input-field"
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !videoUrl.trim()}
              className="btn-primary w-full min-h-[48px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Processing Video... This may take 30-60 seconds
                </span>
              ) : (
                'Add Video Course Module →'
              )}
            </button>
          </form>

          {/* Helpful YouTube Links */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">
              🎥 Recommended Bar Prep YouTube Channels:
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Search "Barbri bar exam [topic]" on YouTube</li>
              <li>• Search "Themis bar review [topic]"</li>
              <li>• Search "Law school bar exam lecture [topic]"</li>
              <li>• Video must have captions/subtitles enabled</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Web Pages */}
      {activeTab === 'Web Pages' && (
        <div className="card space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Scrape Web Page
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Add bar prep websites to the AI knowledge base
            </p>
          </div>

          <form onSubmit={handlePageSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium
                                 text-slate-700 mb-1.5">
                Website URL
              </label>
              <input
                type="url"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                placeholder="https://www.law.cornell.edu/wex/tort"
                className="input-field"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !pageUrl.trim()}
              className="btn-primary w-full min-h-[48px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Scraping Page...
                </span>
              ) : (
                'Add Web Page →'
              )}
            </button>
          </form>

          {/* Quick Add Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">
              Quick Add Cornell Law Pages:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: 'Constitutional Law',  url: 'https://www.law.cornell.edu/wex/constitutional_law' },
                { label: 'Contracts',           url: 'https://www.law.cornell.edu/wex/contract' },
                { label: 'Torts',               url: 'https://www.law.cornell.edu/wex/tort' },
                { label: 'Criminal Law',        url: 'https://www.law.cornell.edu/wex/criminal_law' },
                { label: 'Civil Procedure',     url: 'https://www.law.cornell.edu/wex/civil_procedure' },
                { label: 'Evidence',            url: 'https://www.law.cornell.edu/wex/evidence' },
                { label: 'Real Property',       url: 'https://www.law.cornell.edu/wex/property' },
                { label: 'Family Law',          url: 'https://www.law.cornell.edu/wex/family_law' },
                { label: 'Negligence',          url: 'https://www.law.cornell.edu/wex/negligence' },
                { label: 'Due Process',         url: 'https://www.law.cornell.edu/wex/due_process' },
              ].map(({ label, url }) => (
                <button
                  key={label}
                  onClick={() => setPageUrl(url)}
                  className="p-2 text-left text-xs bg-slate-50
                             border border-slate-200 rounded-lg
                             hover:bg-blue-50 hover:border-blue-300
                             text-slate-600 hover:text-blue-700
                             transition-colors"
                >
                  📄 {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: PDF Upload */}
      {activeTab === 'PDF Upload' && (
        <div className="card space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Upload Study Document
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Upload PDF outlines, notes, or study guides.
              The AI will read and index them for the chat.
            </p>
          </div>

          <form onSubmit={handlePdfUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium
                                 text-slate-700 mb-1.5">
                Select PDF File
              </label>
              <div className="border-2 border-dashed border-slate-300
                              rounded-lg p-6 text-center
                              hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-lg file:border-0
                             file:text-sm file:font-medium
                             file:bg-blue-50 file:text-blue-700
                             hover:file:bg-blue-100"
                  disabled={uploading}
                />
                {pdfFile && (
                  <p className="mt-2 text-sm text-slate-600">
                    Selected: {pdfFile.name}
                    ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {!pdfFile && (
                  <p className="text-slate-400 text-sm mt-2">
                    PDF, TXT, DOC files up to 10MB
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !pdfFile}
              className="btn-primary w-full min-h-[48px]"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Uploading and Indexing...
                </span>
              ) : (
                'Upload and Index Document →'
              )}
            </button>
          </form>

          <div className="bg-blue-50 border border-blue-200
                          rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-1">
              💡 After uploading
            </p>
            <p className="text-sm text-blue-700">
              The AI Chat will automatically search your uploaded
              documents when answering questions. Students can ask
              about specific content from your PDFs directly in chat.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Modules */}
      {activeTab === 'Modules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Course Modules ({modules.length})
            </h2>
            <button
              onClick={loadModules}
              className="btn-secondary text-sm"
            >
              Refresh
            </button>
          </div>

          {loadingModules ? (
            <div className="card flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading modules..." />
            </div>
          ) : modules.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-500">
                No modules yet. Add YouTube videos in the Videos tab.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => (
                <div key={module.id}
                     className="card flex items-start gap-4">
                  {/* Thumbnail */}
                  {module.thumbnail_url && (
                    <img
                      src={module.thumbnail_url}
                      alt={module.title}
                      className="w-24 h-16 object-cover rounded-lg
                                 shrink-0 bg-slate-200"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge bg-blue-100 text-blue-700
                                       text-xs px-2 py-0.5">
                        {module.topic}
                      </span>
                      <span className={`badge text-xs px-2 py-0.5
                        ${module.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                        {module.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 mt-1
                                   text-sm truncate">
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {module.ai_summary}
                    </p>
                  </div>

                  {/* Video link */}
                  {module.video_url && (
                    <a
                      href={module.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-xs hover:underline
                                 shrink-0"
                    >
                      Watch ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
