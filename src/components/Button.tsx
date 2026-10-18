import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { buttonClasses, type ButtonVariant } from './buttonClasses'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  block?: boolean
  loading?: boolean
}

export function Button({
  variant,
  block,
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses(variant, block), className)}
      {...rest}
    >
      {loading ? 'Working…' : children}
    </button>
  )
}
