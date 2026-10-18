import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NoteForm } from './NoteForm'

describe('NoteForm', () => {
  it('will not add an empty note', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<NoteForm onAdd={onAdd} />)
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Write something first.')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('adds a trimmed note and clears the field', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<NoteForm onAdd={onAdd} />)
    await user.type(screen.getByLabelText('New note'), '  Buy milk  {Enter}')
    expect(onAdd).toHaveBeenCalledWith('Buy milk')
    expect(screen.getByLabelText('New note')).toHaveValue('')
  })

  it('keeps the text when saving fails', async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error('Your session has expired. Sign in again.'))
    const user = userEvent.setup()
    render(<NoteForm onAdd={onAdd} />)
    await user.type(screen.getByLabelText('New note'), 'Buy milk{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired.')
    expect(screen.getByLabelText('New note')).toHaveValue('Buy milk')
  })
})
