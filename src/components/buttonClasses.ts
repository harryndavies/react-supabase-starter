import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-text hover:opacity-90',
  secondary: 'border border-line bg-surface text-text hover:bg-bg',
  ghost: 'text-muted hover:text-text',
  danger: 'text-danger hover:underline',
}

/** Shared look, so links can render as buttons too. */
export function buttonClasses(variant: ButtonVariant = 'primary', block = false): string {
  return cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-medium transition',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANT[variant],
    block && 'w-full',
  )
}
