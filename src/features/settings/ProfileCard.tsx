import { useRef, useState, type FormEvent } from 'react'
import { Avatar, Button, Card, TextField } from '@/components'
import { DisplayNameSchema } from '@/features/auth/schemas'
import { useSession } from '@/lib/auth'
import { errorMessage } from '@/lib/errors'
import { firstError } from '@/lib/validation'
import { useAvatarUrl, useProfile, useRename, useSetAvatar } from './queries'

export function ProfileCard() {
  const session = useSession()
  const profile = useProfile()
  const rename = useRename()
  const setAvatar = useSetAvatar()
  const avatarUrl = useAvatarUrl(profile.data?.avatar_path)
  const fileInput = useRef<HTMLInputElement>(null)
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

  if (!profile.data) return null
  const { display_name: name, avatar_path: avatarPath } = profile.data

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Profile</h2>
      <div className="flex items-center gap-4">
        <Avatar name={name} url={avatarUrl.data} size="lg" />
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted">
            {session.user.is_anonymous ? 'Guest account' : `Signed in as ${session.user.email}`}
          </p>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              loading={setAvatar.isPending}
              onClick={() => fileInput.current?.click()}
            >
              {avatarPath ? 'Change picture' : 'Add a picture'}
            </Button>
            {avatarPath && (
              <Button
                variant="ghost"
                disabled={setAvatar.isPending}
                onClick={() => setAvatar.mutate({ file: null, previous: avatarPath })}
              >
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Choose a profile picture"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) setAvatar.mutate({ file, previous: avatarPath })
            }}
          />
        </div>
      </div>
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex items-end gap-2">
        <TextField
          key={name}
          label="Your name"
          name="displayName"
          className="flex-1"
          defaultValue={name}
          error={error}
          hint={saved ? 'Saved.' : undefined}
        />
        <Button type="submit" variant="secondary" loading={rename.isPending}>
          Save
        </Button>
      </form>
    </Card>
  )
}
