import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'
import { dismissToast, getToasts, subscribeToasts, type ToastTone } from '@/lib/toast'

const TONE: Record<ToastTone, string> = {
  info: 'border-line bg-surface text-text',
  success: 'border-accent bg-surface text-text',
  error: 'border-danger bg-surface text-danger',
}

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-lg',
            TONE[t.tone],
          )}
        >
          <span className="text-sm font-medium">{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="text-muted hover:text-text"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
