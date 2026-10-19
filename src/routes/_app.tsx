import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { Avatar } from '@/components'
import { useAvatarUrl, useProfile } from '@/features/settings/queries'
import { getSession } from '@/lib/auth'

// Layout for everything that needs a signed-in user. Pages under routes/_app/
// can call useSession() and always get one.
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    return { session }
  },
  component: AppLayout,
})

const NAV = [
  { to: '/notes', label: 'Notes' },
  { to: '/settings', label: 'Settings' },
] as const

function AppLayout() {
  const profile = useProfile()
  const avatarUrl = useAvatarUrl(profile.data?.avatar_path)
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-8">
      <header className="flex items-center justify-between gap-4 py-4">
        <Link to="/notes" className="text-lg font-semibold">
          Starter
        </Link>
        <nav className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-muted hover:text-text"
              activeProps={{ className: 'bg-surface text-text font-medium' }}
            >
              {item.label}
            </Link>
          ))}
          {profile.data && (
            <Link to="/settings" aria-label="Your profile" className="ml-1 self-center">
              <Avatar name={profile.data.display_name} url={avatarUrl.data} />
            </Link>
          )}
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4">
        <Outlet />
      </main>
    </div>
  )
}
