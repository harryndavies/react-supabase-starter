import type { Session } from '@supabase/supabase-js'
import { useRouteContext } from '@tanstack/react-router'
import { supabase } from './supabase'

/** The current session (from local storage, refreshed if needed), or null. */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** The signed-in session. Only for components under the `_app` layout, which guarantees one. */
export function useSession(): Session {
  return useRouteContext({ from: '/_app', select: (c) => c.session })
}
