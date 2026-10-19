import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useSession } from '@/lib/auth'
import { errorMessage, toAppError } from '@/lib/errors'
import { squarePhoto } from '@/lib/image'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

const ProfileSchema = z.object({
  id: z.guid(),
  display_name: z.string(),
  avatar_path: z.string().nullable(),
})
export type Profile = z.infer<typeof ProfileSchema>

const profileKey = (userId: string) => ['profile', userId] as const
const AVATARS = 'avatars'
const SIGNED_URL_SECONDS = 60 * 60

export function useProfile() {
  const userId = useSession().user.id
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_path')
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

/**
 * A short-lived link to a private file. Refreshed before it expires; the path
 * changes with every upload, so there is no stale-image problem.
 */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['avatar-url', path],
    enabled: !!path,
    staleTime: (SIGNED_URL_SECONDS - 5 * 60) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(AVATARS)
        .createSignedUrl(path as string, SIGNED_URL_SECONDS)
      if (error) throw toAppError(error)
      return data.signedUrl
    },
  })
}

/** Uploads a new picture (or removes it with `null`) and tidies up the old file. */
export function useSetAvatar() {
  const userId = useSession().user.id
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, previous }: { file: File | null; previous: string | null }) => {
      let path: string | null = null
      if (file) {
        path = `${userId}/${crypto.randomUUID()}.jpg`
        const { error } = await supabase.storage
          .from(AVATARS)
          .upload(path, await squarePhoto(file), { contentType: 'image/jpeg' })
        if (error) throw toAppError(error)
      }
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_path: path })
        .eq('id', userId)
      if (error) throw toAppError(error)
      // Best effort: an orphaned old file is harmless, so don't fail over it.
      if (previous) await supabase.storage.from(AVATARS).remove([previous])
    },
    onError: (err) => toast(errorMessage(err), 'error'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  })
}
