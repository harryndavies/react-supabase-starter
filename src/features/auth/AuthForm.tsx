import { useState, type FormEvent } from 'react'
import { Button, Card, TextField } from '@/components'
import { errorMessage } from '@/lib/errors'
import { fieldErrors } from '@/lib/validation'
import { signIn, signInAsGuest, signUp } from './api'
import { GuestSchema, SignInSchema, SignUpSchema } from './schemas'

type Mode = 'sign-in' | 'sign-up' | 'guest'
type Outcome = 'signed-in' | 'check-inbox'

const TITLES: Record<Mode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create an account',
  guest: 'Continue as a guest',
}

/** Validates the form for this mode, returning either errors or the action to run. */
function prepare(
  mode: Mode,
  form: Record<string, FormDataEntryValue>,
): { errors: Record<string, string> } | { run: () => Promise<Outcome> } {
  if (mode === 'sign-in') {
    const parsed = SignInSchema.safeParse(form)
    if (!parsed.success) return { errors: fieldErrors(parsed.error) }
    const { email, password } = parsed.data
    return { run: () => signIn(email, password).then(() => 'signed-in' as const) }
  }
  if (mode === 'sign-up') {
    const parsed = SignUpSchema.safeParse(form)
    if (!parsed.success) return { errors: fieldErrors(parsed.error) }
    const { email, password, displayName } = parsed.data
    return {
      run: async () => ((await signUp(email, password, displayName)) ? 'signed-in' : 'check-inbox'),
    }
  }
  const parsed = GuestSchema.safeParse(form)
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const { displayName } = parsed.data
  return { run: () => signInAsGuest(displayName).then(() => 'signed-in' as const) }
}

/** Sign in, sign up or continue as a guest. Calls onDone once signed in. */
export function AuthForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function switchTo(next: Mode) {
    setMode(next)
    setErrors({})
    setNotice(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setNotice(null)
    const prepared = prepare(mode, Object.fromEntries(new FormData(event.currentTarget)))
    if ('errors' in prepared) {
      setErrors(prepared.errors)
      return
    }
    setBusy(true)
    try {
      const outcome = await prepared.run()
      if (outcome === 'check-inbox') {
        setNotice('Check your inbox: click the link in the email to finish signing up.')
      } else {
        onDone()
      }
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{TITLES[mode]}</h1>
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        {mode !== 'sign-in' && (
          <TextField
            label="Your name"
            name="displayName"
            autoComplete="nickname"
            error={errors.displayName}
          />
        )}
        {mode !== 'guest' && (
          <>
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
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              error={errors.password}
            />
          </>
        )}
        {errors.form && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.form}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-muted">
            {notice}
          </p>
        )}
        <Button type="submit" block loading={busy}>
          {TITLES[mode]}
        </Button>
      </form>
      <div className="flex flex-col items-center gap-1 text-sm">
        {mode !== 'sign-in' && (
          <Button variant="ghost" onClick={() => switchTo('sign-in')}>
            I already have an account
          </Button>
        )}
        {mode !== 'sign-up' && (
          <Button variant="ghost" onClick={() => switchTo('sign-up')}>
            Create an account
          </Button>
        )}
        {mode !== 'guest' && (
          <Button variant="ghost" onClick={() => switchTo('guest')}>
            Try it without an account
          </Button>
        )}
      </div>
    </Card>
  )
}
