import { toAppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw toAppError(error)
}

/**
 * Returns false when the project requires email confirmation: there is no session
 * until the person clicks the link in their inbox.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
  })
  if (error) throw toAppError(error)
  return data.session !== null
}

/** A guest account: no email needed, and it can be upgraded later. */
export async function signInAsGuest(displayName: string): Promise<void> {
  const { error } = await supabase.auth.signInAnonymously({
    options: { data: { display_name: displayName } },
  })
  if (error) throw toAppError(error)
}

/** Keeps a guest's data by adding an email and password to their account. */
export async function upgradeGuest(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email, password })
  if (error) throw toAppError(error)
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw toAppError(error)
}
