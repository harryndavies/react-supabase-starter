import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AppError, errorMessage, toAppError } from './errors'

describe('toAppError', () => {
  it('maps a code raised by a database function', () => {
    const err = toAppError({ message: 'not_signed_in', code: 'P0001' })
    expect(err).toBeInstanceOf(AppError)
    expect(err.code).toBe('not_signed_in')
    expect(err.message).toMatch(/sign in again/i)
  })

  it('maps a Supabase Auth error code', () => {
    expect(
      toAppError({ message: 'Invalid login credentials', code: 'invalid_credentials' }).code,
    ).toBe('invalid_credentials')
  })

  it('never shows raw database messages', () => {
    const err = toAppError({ message: 'duplicate key value violates unique constraint "x"' })
    expect(err.code).toBe('unknown')
    expect(err.message).toBe('Something went wrong. Try again.')
  })
})

describe('errorMessage', () => {
  it('never shows validation internals', () => {
    const parsed = z.object({ id: z.guid() }).safeParse({ id: 'nope' })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(errorMessage(parsed.error)).toBe('Something went wrong. Try again.')
    }
  })

  it('falls back for things that are not errors', () => {
    expect(errorMessage('boom')).toBe('Something went wrong. Try again.')
    expect(errorMessage(new Error('Nope'))).toBe('Nope')
  })
})
