import { describe, expect, it } from 'vitest'
import { fieldErrors } from '@/lib/validation'
import { RedirectSchema, SignUpSchema } from './schemas'

describe('RedirectSchema', () => {
  it('keeps same-site paths', () => {
    expect(RedirectSchema.parse('/notes?x=1')).toBe('/notes?x=1')
  })

  it('drops anything that could leave the site', () => {
    for (const evil of ['//evil.example', 'https://evil.example', 'javascript:alert(1)', 'notes']) {
      expect(RedirectSchema.parse(evil)).toBeUndefined()
    }
  })
})

describe('SignUpSchema', () => {
  it('reports each problem against its field', () => {
    const result = SignUpSchema.safeParse({ email: 'nope', password: 'short', displayName: '  ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(Object.keys(fieldErrors(result.error)).sort()).toEqual([
        'displayName',
        'email',
        'password',
      ])
    }
  })

  it('trims the name', () => {
    const result = SignUpSchema.parse({
      email: 'a@example.com',
      password: 'longenough',
      displayName: ' Sam ',
    })
    expect(result.displayName).toBe('Sam')
  })
})
