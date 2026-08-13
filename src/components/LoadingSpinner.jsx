export default function LoadingSpinner({
  size    = 'md',
  text    = '',
  color   = 'blue',
  overlay = false,
  fullPage = false,
}) {
  // ── Size map ─────────────────────────────────────────────
  const sizes = {
    xs: 'w-3 h-3 border-[1.5px]',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-[3px]',
    xl: 'w-16 h-16 border-4',
  }

  // ── Color map ─────────────────────────────────────────────
  const colors = {
    blue:  'border-slate-200 border-t-blue-600',
    white: 'border-white/30 border-t-white',
    green: 'border-slate-200 border-t-green-500',
    red:   'border-slate-200 border-t-red-500',
    amber: 'border-slate-200 border-t-amber-500',
  }

  const sizeClass  = sizes[size]  ?? sizes.md
  const colorClass = colors[color] ?? colors.blue

  // ── Spinner core ──────────────────────────────────────────
  const spinner = (
    <div
      role="status"
      aria-label={text || 'Loading'}
      className="flex flex-col items-center justify-center gap-3"
    >
      <div
        className={`
          ${sizeClass} ${colorClass}
          animate-spin rounded-full
        `}
      />
      {text && (
        <p className={`
          text-sm animate-pulse text-center max-w-[200px]
          ${color === 'white' ? 'text-white/70' : 'text-slate-500'}
        `}>
          {text}
        </p>
      )}
      {/* Hidden text for screen readers */}
      <span className="sr-only">{text || 'Loading, please wait'}</span>
    </div>
  )

  // ── Full page variant ─────────────────────────────────────
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center
                      justify-center bg-slate-950">
        {spinner}
      </div>
    )
  }

  // ── Overlay variant ───────────────────────────────────────
  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center
                      justify-center bg-white/60 backdrop-blur-sm
                      rounded-xl">
        {spinner}
      </div>
    )
  }

  return spinner
}
