import { Button } from '@/components'
import { cn } from '@/lib/cn'
import type { Note } from './schemas'

interface NoteListProps {
  notes: readonly Note[]
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

export function NoteList({ notes, onToggle, onDelete }: NoteListProps) {
  if (notes.length === 0) {
    return <p className="py-8 text-center text-muted">No notes yet. Add your first one above.</p>
  }
  return (
    <ul className="divide-y divide-line">
      {notes.map((note) => (
        <li key={note.id} className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            className="size-5 accent-accent"
            checked={note.done}
            onChange={(e) => onToggle(note.id, e.target.checked)}
            aria-label={`Mark "${note.body}" as ${note.done ? 'not done' : 'done'}`}
          />
          <span className={cn('flex-1 break-words', note.done && 'text-muted line-through')}>
            {note.body}
          </span>
          <Button
            variant="danger"
            onClick={() => onDelete(note.id)}
            aria-label={`Delete "${note.body}"`}
          >
            Delete
          </Button>
        </li>
      ))}
    </ul>
  )
}
