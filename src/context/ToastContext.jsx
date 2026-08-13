// src/context/ToastContext.jsx
import {
  createContext, useContext, useState,
  useCallback, useEffect, useRef,
} from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
}

function Toast({ id, type = 'info', message, onDismiss }) {
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(id), 4000)
    return () => clearTimeout(timerRef.current)
  }, [id, onDismiss])

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg
        border text-sm font-medium animate-fade-in max-w-sm w-full
        ${type === 'success' ? 'bg-green-50 border-green-200 text-green-800'  : ''}
        ${type === 'error'   ? 'bg-red-50 border-red-200 text-red-800'        : ''}
        ${type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800'  : ''}
        ${type === 'info'    ? 'bg-blue-50 border-blue-200 text-blue-800'     : ''}
      `}
    >
      <span className="shrink-0 text-base">{ICONS[type]}</span>
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 opacity-50 hover:opacity-100
                   transition-opacity text-xs font-bold"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(toast => toast.id !== id))
  }, [])

  const show = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(t => [...t, { id, message, type }])
    return id
  }, [])

  const toast = {
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning'),
    info:    (msg) => show(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[99999]
                        flex flex-col gap-2 items-end">
          {toasts.map(t => (
            <Toast
              key={t.id}
              id={t.id}
              type={t.type}
              message={t.message}
              onDismiss={dismiss}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
