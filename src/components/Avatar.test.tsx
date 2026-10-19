import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { initials } from '@/lib/initials'
import { Avatar } from './Avatar'

describe('initials', () => {
  it('uses the first and last names', () => {
    expect(initials('Sam Smith')).toBe('SS')
    expect(initials('  ana  maria lopez ')).toBe('AL')
    expect(initials('sam')).toBe('S')
    expect(initials('   ')).toBe('?')
  })
})

describe('Avatar', () => {
  it('shows the picture when there is one, initials otherwise', () => {
    const { container, rerender } = render(<Avatar name="Sam Smith" />)
    expect(screen.getByText('SS')).toBeInTheDocument()
    rerender(<Avatar name="Sam Smith" url="https://example.com/a.jpg" />)
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.jpg')
  })
})
