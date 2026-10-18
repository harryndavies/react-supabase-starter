import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { buttonClasses, Card } from '@/components'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
  errorComponent: RootError,
})

function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 pt-16">
      <Card className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <Link to="/" className={buttonClasses('primary')}>
          Go home
        </Link>
      </Card>
    </main>
  )
}

function RootError({ error }: { error: unknown }) {
  return (
    <main className="mx-auto max-w-md px-4 pt-16">
      <Card className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted">{error instanceof Error ? error.message : String(error)}</p>
        <a href="/" className={buttonClasses('primary')}>
          Start again
        </a>
      </Card>
    </main>
  )
}
