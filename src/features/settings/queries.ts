import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useSession } from '@/lib/auth'
import { toAppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

const ProfileSchema = z.object({ id: z.uuid(), display_name: z.string() })

const profileKey = (userId: string) => ['profile', userId] as const

export function useProfile() {
  const userId = useSession().user.id
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', userId)
        .single()
      if (error) throw toAppError(error)
      return ProfileSchema.parse(data)
    },
  })
}

export function useRename() {
  const userId = useSession().user.id
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (displayName: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', userId)
      if (error) throw toAppError(error)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  })
}
