import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthForm } from '@/features/auth/AuthForm'
import { RedirectSchema } from '@/features/auth/schemas'
import { getSession } from '@/lib/auth'

export const Route = createFileRoute('/sign-in')({
  validateSearch: z.object({ redirect: RedirectSchema }),
  beforeLoad: async ({ search }) => {
    if (await getSession()) throw redirect({ to: search.redirect ?? '/notes' })
  },
  component: SignIn,
})

function SignIn() {
  const { redirect: to } = Route.useSearch()
  const navigate = useNavigate()
  return (
    <main className="mx-auto max-w-sm px-4 pt-16">
      <AuthForm onDone={() => void navigate({ to: to ?? '/notes' })} />
    </main>
  )
}
