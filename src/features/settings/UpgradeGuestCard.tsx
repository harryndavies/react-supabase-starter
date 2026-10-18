import { useState, type FormEvent } from 'react'
import { Button, Card, TextField } from '@/components'
import { upgradeGuest } from '@/features/auth/api'
import { SignInSchema } from '@/features/auth/schemas'
import { errorMessage } from '@/lib/errors'
import { fieldErrors } from '@/lib/validation'

/** Lets a guest keep their data by adding an email and password. */
export function UpgradeGuestCard() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = SignInSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    setBusy(true)
    try {
      await upgradeGuest(parsed.data.email, parsed.data.password)
      setDone(true)
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Keep your account</h2>
      {done ? (
        <p className="text-sm">
          Nearly there: check your inbox and click the link to confirm your email. Your notes stay
          where they are.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">
            You&rsquo;re using a guest account. Add an email to sign in on other devices and keep
            your notes if you clear this browser.
          </p>
          <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              error={errors.email}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              error={errors.password}
            />
            {errors.form && (
              <p role="alert" className="text-sm font-medium text-danger">
                {errors.form}
              </p>
            )}
            <Button type="submit" loading={busy}>
              Save my account
            </Button>
          </form>
        </>
      )}
    </Card>
  )
}
