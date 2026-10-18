import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components'
import { signOut } from '@/features/auth/api'
import { NotificationsCard } from '@/features/settings/NotificationsCard'
import { ProfileCard } from '@/features/settings/ProfileCard'
import { UpgradeGuestCard } from '@/features/settings/UpgradeGuestCard'
import { useSession } from '@/lib/auth'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const session = useSession()
  return (
    <>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <ProfileCard />
      {session.user.is_anonymous && <UpgradeGuestCard />}
      <NotificationsCard />
      <Button variant="secondary" className="self-start" onClick={() => void signOut()}>
        Sign out
      </Button>
    </>
  )
}
