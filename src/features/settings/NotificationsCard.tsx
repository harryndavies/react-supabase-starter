import { Button, Card } from '@/components'
import { usePush } from '@/lib/push'

export function NotificationsCard() {
  const { state, busy, error, enable, disable } = usePush()
  if (state === 'unsupported') return null

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Notifications</h2>
      {state === 'ios-install' && (
        <p className="text-sm text-muted">
          On iPhone and iPad, notifications only work once the app is on your home screen: tap
          Share, then Add to Home Screen, and open it from there.
        </p>
      )}
      {state === 'denied' && (
        <p className="text-sm text-muted">
          Notifications are blocked for this site. Allow them in your browser&rsquo;s site settings.
        </p>
      )}
      {state === 'off' && (
        <>
          <p className="text-sm text-muted">Get a daily reminder when you have open notes.</p>
          <Button loading={busy} onClick={() => void enable()}>
            Turn on notifications
          </Button>
        </>
      )}
      {state === 'on' && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm">Notifications are on for this device.</p>
          <Button variant="secondary" loading={busy} onClick={() => void disable()}>
            Turn off
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </Card>
  )
}
