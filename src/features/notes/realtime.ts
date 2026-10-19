import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { noteKeys } from './queries'

/**
 * Keeps the notes list live: any change to this user's notes (from another tab,
 * device or the database) refetches it. Row level security still applies to
 * what Realtime sends, and the migration adds notes to its publication.
 */
export function useNotesRealtime() {
  const userId = useSession().user.id
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`notes:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: noteKeys.all(userId) }),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
