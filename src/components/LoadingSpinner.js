export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} animate-spin rounded-full 
                       border-2 border-slate-200 border-t-blue-600`} />
      {text && (
        <p className="text-sm text-slate-500 animate-pulse">{text}</p>
      )}
    </div>
  )
}
