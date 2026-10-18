import { useState, type FormEvent } from 'react'
import { Button, Card, TextField } from '@/components'
import { DisplayNameSchema } from '@/features/auth/schemas'
import { useSession } from '@/lib/auth'
import { errorMessage } from '@/lib/errors'
import { firstError } from '@/lib/validation'
import { useProfile, useRename } from './queries'

export function ProfileCard() {
  const session = useSession()
  const profile = useProfile()
  const rename = useRename()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = DisplayNameSchema.safeParse(new FormData(event.currentTarget).get('displayName'))
    if (!parsed.success) {
      setError(firstError(parsed.error))
      return
    }
    setError(null)
    setSaved(false)
    try {
      await rename.mutateAsync(parsed.data)
      setSaved(true)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Profile</h2>
      <p className="text-sm text-muted">
        {session.user.is_anonymous ? 'Guest account' : `Signed in as ${session.user.email}`}
      </p>
      {profile.data && (
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex items-end gap-2">
          <TextField
            key={profile.data.display_name}
            label="Your name"
            name="displayName"
            className="flex-1"
            defaultValue={profile.data.display_name}
            error={error}
            hint={saved ? 'Saved.' : undefined}
          />
          <Button type="submit" variant="secondary" loading={rename.isPending}>
            Save
          </Button>
        </form>
      )}
    </Card>
  )
}
