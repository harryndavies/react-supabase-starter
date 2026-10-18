import { describe, expect, it } from 'vitest'
import { NoteBodySchema, sortNotes, type Note } from './schemas'

const note = (id: string, done: boolean, created_at: string): Note => ({
  id,
  user_id: '00000000-0000-0000-0000-000000000001',
  body: id,
  done,
  created_at,
  updated_at: created_at,
})

describe('sortNotes', () => {
  it('puts open notes first, newest first within each group', () => {
    const sorted = sortNotes([
      note('old-done', true, '2026-01-01'),
      note('old-open', false, '2026-01-01'),
      note('new-done', true, '2026-01-03'),
      note('new-open', false, '2026-01-02'),
    ])
    expect(sorted.map((n) => n.id)).toEqual(['new-open', 'old-open', 'new-done', 'old-done'])
  })
})

describe('NoteBodySchema', () => {
  it('matches the database rules', () => {
    expect(NoteBodySchema.parse('  Buy milk ')).toBe('Buy milk')
    expect(NoteBodySchema.safeParse('   ').success).toBe(false)
    expect(NoteBodySchema.safeParse('x'.repeat(501)).success).toBe(false)
  })
})
