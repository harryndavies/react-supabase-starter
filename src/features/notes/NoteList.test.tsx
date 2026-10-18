import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NoteList } from './NoteList'
import type { Note } from './schemas'

const milk: Note = {
  id: '00000000-0000-0000-0000-0000000000a1',
  user_id: '00000000-0000-0000-0000-000000000001',
  body: 'Buy milk',
  done: false,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}
const notes = [milk]

describe('NoteList', () => {
  it('has a friendly empty state', () => {
    render(<NoteList notes={[]} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('ticks off and deletes notes', async () => {
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<NoteList notes={notes} onToggle={onToggle} onDelete={onDelete} />)
    await user.click(screen.getByRole('checkbox', { name: /buy milk/i }))
    expect(onToggle).toHaveBeenCalledWith(milk.id, true)
    await user.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }))
    expect(onDelete).toHaveBeenCalledWith(milk.id)
  })
})
