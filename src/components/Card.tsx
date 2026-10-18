import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('rounded-xl border border-line bg-surface p-4', className)} {...rest} />
  )
}
