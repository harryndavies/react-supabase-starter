import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getToasts, dismissToast, toast } from '@/lib/toast'
import { Sheet } from './Sheet'
import { Toaster } from './Toaster'

afterEach(() => {
  for (const t of getToasts()) dismissToast(t.id)
  vi.useRealTimers()
})

describe('Toaster', () => {
  it('shows toasts from anywhere and lets people dismiss them', async () => {
    const user = userEvent.setup()
    render(<Toaster />)
    act(() => {
      toast('Saved', 'success')
      toast('That failed', 'error')
    })
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
    expect(screen.getByRole('alert')).toHaveTextContent('That failed')
    await user.click(screen.getAllByRole('button', { name: 'Dismiss' })[0] as HTMLElement)
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('hides toasts after a few seconds and keeps at most three', () => {
    vi.useFakeTimers()
    render(<Toaster />)
    act(() => {
      for (const n of [1, 2, 3, 4]) toast(`Toast ${n}`)
    })
    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument()
    expect(screen.getAllByRole('status')).toHaveLength(3)
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.queryAllByRole('status')).toHaveLength(0)
  })
})

describe('Sheet', () => {
  it('opens as a dialog and closes from its button', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <Sheet open={false} onClose={onClose} title="Are you sure?">
        <p>Body</p>
      </Sheet>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(
      <Sheet open onClose={onClose} title="Are you sure?">
        <p>Body</p>
      </Sheet>,
    )
    expect(screen.getByRole('dialog', { name: 'Are you sure?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
