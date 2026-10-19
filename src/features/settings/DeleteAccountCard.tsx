import { useState, type FormEvent } from 'react'
import { Button, Card, Sheet, TextField } from '@/components'
import { toAppError, errorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

const CONFIRM_WORD = 'delete'

export function DeleteAccountCard() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const typed = String(new FormData(event.currentTarget).get('confirm') ?? '')
    if (typed.trim().toLowerCase() !== CONFIRM_WORD) {
      setError(`Type "${CONFIRM_WORD}" to confirm.`)
      return
    }
    setError(null)
    setBusy(true)
    try {
      const { error: fnError } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      })
      if (fnError) throw toAppError(fnError)
      // The account is gone on the server; clear the local session too. (Auth
      // answers this with a 403 because the user no longer exists; supabase-js
      // clears the session regardless.)
      await supabase.auth.signOut({ scope: 'local' })
      toast('Your account has been deleted.', 'success')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Delete account</h2>
      <p className="text-sm text-muted">
        Permanently removes your account, notes and profile picture. This can&rsquo;t be undone.
      </p>
      <Button variant="danger" className="self-start" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          <p className="text-sm">
            Everything goes, straight away. Type <strong>{CONFIRM_WORD}</strong> to confirm.
          </p>
          <TextField label="Confirm" name="confirm" autoComplete="off" error={error} />
          <Button type="submit" block loading={busy} className="bg-danger text-white">
            Delete everything
          </Button>
        </form>
      </Sheet>
    </Card>
  )
}
