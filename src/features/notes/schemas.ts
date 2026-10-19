import { z } from 'zod'

/** A note row as the API returns it. Parsing it catches schema drift early. */
export const NoteSchema = z.object({
  id: z.guid(),
  user_id: z.guid(),
  body: z.string(),
  done: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Note = z.infer<typeof NoteSchema>

/** Same rules as the database's check constraint, so errors show before saving. */
export const NoteBodySchema = z
  .string()
  .trim()
  .min(1, 'Write something first.')
  .max(500, 'Keep notes under 500 characters.')

/** Open notes first (newest first), then finished ones. */
export function sortNotes(notes: readonly Note[]): Note[] {
  return [...notes].sort((a, b) =>
    a.done === b.done ? b.created_at.localeCompare(a.created_at) : a.done ? 1 : -1,
  )
}
