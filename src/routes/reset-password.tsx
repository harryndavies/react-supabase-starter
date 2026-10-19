import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { buttonClasses, Button, Card, TextField } from '@/components'
import { setNewPassword } from '@/features/auth/api'
import { NewPasswordSchema } from '@/features/auth/schemas'
import { getSession } from '@/lib/auth'
import { errorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import { fieldErrors } from '@/lib/validation'

// The reset email links here. Supabase signs the person in from the link
// before this runs, so a session means the link was valid.
export const Route = createFileRoute('/reset-password')({
  beforeLoad: async () => ({ linkValid: (await getSession()) !== null }),
  component: ResetPassword,
})

function ResetPassword() {
  const { linkValid } = Route.useRouteContext()
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = NewPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    )
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    setBusy(true)
    try {
      await setNewPassword(parsed.data.password)
      toast('Your password has been changed.', 'success')
      await navigate({ to: '/notes' })
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 pt-16">
      <Card className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        {linkValid ? (
          <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
            <TextField
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              error={errors.password}
            />
            <TextField
              label="Type it again"
              name="confirm"
              type="password"
              autoComplete="new-password"
              error={errors.confirm}
            />
            {errors.form && (
              <p role="alert" className="text-sm font-medium text-danger">
                {errors.form}
              </p>
            )}
            <Button type="submit" block loading={busy}>
              Save password
            </Button>
          </form>
        ) : (
          <>
            <p className="text-muted">
              This link has expired or has already been used. Ask for a new one from the sign-in
              page.
            </p>
            <Link to="/sign-in" className={buttonClasses('primary')}>
              Back to sign in
            </Link>
          </>
        )}
      </Card>
    </main>
  )
}
