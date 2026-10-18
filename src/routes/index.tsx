import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/auth'

// "/" just sends you to the right place.
export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    throw redirect({ to: (await getSession()) ? '/notes' : '/sign-in' })
  },
})
