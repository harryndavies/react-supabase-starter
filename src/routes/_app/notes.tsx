import { createFileRoute } from '@tanstack/react-router'
import { Button, Card } from '@/components'
import { NoteForm } from '@/features/notes/NoteForm'
import { NoteList } from '@/features/notes/NoteList'
import {
  useAddNote,
  useClearDone,
  useDeleteNote,
  useNotes,
  useSetNoteDone,
} from '@/features/notes/queries'
import { errorMessage } from '@/lib/errors'

export const Route = createFileRoute('/_app/notes')({
  component: NotesPage,
})

function NotesPage() {
  const notes = useNotes()
  const add = useAddNote()
  const setDone = useSetNoteDone()
  const remove = useDeleteNote()
  const clearDone = useClearDone()
  const doneCount = notes.data?.filter((n) => n.done).length ?? 0

  return (
    <>
      <h1 className="text-2xl font-semibold">Notes</h1>
      <Card className="flex flex-col gap-4">
        <NoteForm onAdd={(body) => add.mutateAsync(body)} />
        {notes.isPending ? (
          <p className="py-8 text-center text-muted">Loading…</p>
        ) : notes.isError ? (
          <p role="alert" className="py-8 text-center text-danger">
            {errorMessage(notes.error)}
          </p>
        ) : (
          <NoteList
            notes={notes.data}
            onToggle={(id, done) => setDone.mutate({ id, done })}
            onDelete={(id) => remove.mutate(id)}
          />
        )}
        {doneCount > 0 && (
          <Button
            variant="secondary"
            className="self-end"
            loading={clearDone.isPending}
            onClick={() => clearDone.mutate()}
          >
            Clear {doneCount} done
          </Button>
        )}
      </Card>
    </>
  )
}
