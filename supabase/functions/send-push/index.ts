// Delivers a Web Push notification to every device of the given users.
// Called by the database (private.notify_users, through pg_net) with the shared
// x-cron-secret header; never by clients.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

interface Message {
  user_ids: string[]
  title: string
  body?: string
  url?: string
}

interface Subscription {
  endpoint: string
  p256dh: string
  auth: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function sameSecret(a: string, b: string): boolean {
  if (a.length === 0 || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (!sameSecret(req.headers.get('x-cron-secret') ?? '', Deno.env.get('CRON_SECRET') ?? '')) {
    return json({ error: 'forbidden' }, 403)
  }

  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!publicKey || !privateKey) return json({ error: 'VAPID keys not configured' }, 500)
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:you@example.com',
    publicKey,
    privateKey,
  )

  const msg = (await req.json().catch(() => null)) as Message | null
  if (!msg || !Array.isArray(msg.user_ids) || msg.user_ids.length === 0 || !msg.title) {
    return json({ error: 'bad request' }, 400)
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      auth: { persistSession: false },
    },
  )
  const { data, error } = await sb
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', msg.user_ids)
  if (error) return json({ error: error.message }, 500)

  // Only same-site paths, so a notification can never send someone elsewhere.
  const url = typeof msg.url === 'string' && /^\/(?!\/)/.test(msg.url) ? msg.url : '/'
  const payload = JSON.stringify({
    title: String(msg.title).slice(0, 120),
    body: String(msg.body ?? '').slice(0, 300),
    url,
  })

  const gone: string[] = []
  let sent = 0
  let failed = 0
  await Promise.all(
    ((data ?? []) as Subscription[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 24 },
        )
        sent++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // 404/410: the device unsubscribed or the subscription expired.
        if (status === 404 || status === 410) gone.push(s.endpoint)
        else {
          failed++
          console.error('push failed', status, err instanceof Error ? err.message : err)
        }
      }
    }),
  )

  if (gone.length) await sb.rpc('drop_push_subscriptions', { p_endpoints: gone })
  return json({ sent, failed, removed: gone.length })
})
