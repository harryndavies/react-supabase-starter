import { useState, type FormEvent } from 'react'
import { Button, TextField } from '@/components'
import { errorMessage } from '@/lib/errors'
import { firstError } from '@/lib/validation'
import { NoteBodySchema } from './schemas'

/** Adds a note. `onAdd` saves it; the form clears once that succeeds. */
export function NoteForm({ onAdd }: { onAdd: (body: string) => Promise<void> }) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = NoteBodySchema.safeParse(body)
    if (!parsed.success) {
      setError(firstError(parsed.error))
      return
    }
    setError(null)
    setBusy(true)
    try {
      await onAdd(parsed.data)
      setBody('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex items-end gap-2">
      <TextField
        label="New note"
        className="flex-1"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What needs doing?"
        error={error}
      />
      <Button type="submit" loading={busy}>
        Add
      </Button>
    </form>
  )
}
