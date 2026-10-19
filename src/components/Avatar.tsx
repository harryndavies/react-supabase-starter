import { cn } from '@/lib/cn'
import { initials } from '@/lib/initials'

export interface AvatarProps {
  name: string
  url?: string | null
  size?: 'sm' | 'lg'
  className?: string
}

export function Avatar({ name, url, size = 'sm', className }: AvatarProps) {
  const box = size === 'lg' ? 'size-16 text-xl' : 'size-8 text-xs'
  return url ? (
    <img src={url} alt="" className={cn('shrink-0 rounded-full object-cover', box, className)} />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-text',
        box,
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
