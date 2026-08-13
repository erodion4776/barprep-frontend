import { StrictMode }    from 'react'
import { createRoot }    from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ProgressProvider } from './context/ProgressContext'
import { AuthProvider }     from './context/AuthContext'
import { ToastProvider }    from './context/ToastContext'
import App                  from './App'
import './index.css'

// ── Error Boundary ────────────────────────────────────────────────────────────
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App Error Boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center
                        justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-6xl">⚠️</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900">
                Something went wrong
              </h1>
              <p className="text-slate-500 text-sm">
                BarPrep AI encountered an unexpected error.
                Please refresh the page to continue.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-slate-400
                                      cursor-pointer hover:text-slate-600">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 p-3 bg-red-50 border border-red-200
                                  rounded-xl text-xs text-red-700
                                  overflow-x-auto whitespace-pre-wrap">
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold
                           text-sm rounded-xl hover:bg-blue-700
                           transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.href = '/'
                }}
                className="px-6 py-2.5 border border-slate-200
                           text-slate-600 font-bold text-sm rounded-xl
                           hover:bg-slate-50 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Mount ─────────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ProgressProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ProgressProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
