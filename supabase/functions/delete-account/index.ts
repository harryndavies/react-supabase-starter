// Permanently deletes the signed-in user. Their profile, notes and push
// subscriptions go with them (foreign keys cascade from auth.users); files in
// Storage don't cascade, so they are removed first.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })

// Every bucket that keeps files in a <user id>/ folder.
const USER_BUCKETS = ['avatars']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  // Who is asking? Only ever delete the caller, never an id from the body.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: caller, error: authError } = await admin.auth.getUser(token)
  if (authError || !caller.user) return json({ error: 'not_signed_in' }, 401)
  const userId = caller.user.id

  for (const bucket of USER_BUCKETS) {
    const { data: files, error } = await admin.storage.from(bucket).list(userId, { limit: 1000 })
    if (error) return json({ error: `could not list ${bucket}: ${error.message}` }, 500)
    if (files.length) {
      const { error: removeError } = await admin.storage
        .from(bucket)
        .remove(files.map((f) => `${userId}/${f.name}`))
      if (removeError)
        return json({ error: `could not remove ${bucket}: ${removeError.message}` }, 500)
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return json({ error: error.message }, 500)
  return json({ deleted: true })
})
