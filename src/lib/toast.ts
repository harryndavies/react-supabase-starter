// A tiny toast store. Call toast() from anywhere (components, mutations, plain
// functions); <Toaster /> in the root route shows them.
export type ToastTone = 'info' | 'success' | 'error'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const DURATION_MS = 4000
let toasts: readonly Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function toast(message: string, tone: ToastTone = 'info'): number {
  const id = nextId++
  // Keep the last three, so a burst of errors can't fill the screen.
  toasts = [...toasts.slice(-2), { id, message, tone }]
  emit()
  setTimeout(() => dismissToast(id), DURATION_MS)
  return id
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts(): readonly Toast[] {
  return toasts
}
