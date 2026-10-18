import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthForm } from './AuthForm'
import * as api from './api'

vi.mock('./api', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInAsGuest: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

describe('AuthForm', () => {
  it('validates before calling Supabase', async () => {
    const user = userEvent.setup()
    render(<AuthForm onDone={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(api.signIn).not.toHaveBeenCalled()
  })

  it('signs in and calls onDone', async () => {
    vi.mocked(api.signIn).mockResolvedValue()
    const onDone = vi.fn()
    const user = userEvent.setup()
    render(<AuthForm onDone={onDone} />)
    await user.type(screen.getByLabelText('Email'), 'sam@example.com')
    await user.type(screen.getByLabelText('Password'), 'correct-horse')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(api.signIn).toHaveBeenCalledWith('sam@example.com', 'correct-horse')
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('continues as a guest with just a name', async () => {
    vi.mocked(api.signInAsGuest).mockResolvedValue()
    const user = userEvent.setup()
    render(<AuthForm onDone={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Try it without an account' }))
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Your name'), ' Sam ')
    await user.click(screen.getByRole('button', { name: 'Continue as a guest' }))
    expect(api.signInAsGuest).toHaveBeenCalledWith('Sam')
  })

  it('asks people to check their inbox when email confirmation is on', async () => {
    vi.mocked(api.signUp).mockResolvedValue(false)
    const onDone = vi.fn()
    const user = userEvent.setup()
    render(<AuthForm onDone={onDone} />)
    await user.click(screen.getByRole('button', { name: 'Create an account' }))
    await user.type(screen.getByLabelText('Your name'), 'Sam')
    await user.type(screen.getByLabelText('Email'), 'sam@example.com')
    await user.type(screen.getByLabelText('Password'), 'correct-horse')
    await user.click(screen.getByRole('button', { name: 'Create an account' }))
    expect(await screen.findByRole('status')).toHaveTextContent(/check your inbox/i)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('shows a friendly error when Supabase refuses', async () => {
    vi.mocked(api.signIn).mockRejectedValue(new Error('That email and password do not match.'))
    const user = userEvent.setup()
    render(<AuthForm onDone={vi.fn()} />)
    await user.type(screen.getByLabelText('Email'), 'sam@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That email and password do not match.',
    )
  })
})
