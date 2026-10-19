import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useSession } from '@/lib/auth'
import { errorMessage, toAppError } from '@/lib/errors'
import { rpcParsed } from '@/lib/rpc'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { NoteSchema, sortNotes, type Note } from './schemas'

// Keys include the user, so one person's cache can never show for another.
export const noteKeys = {
  all: (userId: string) => ['notes', userId] as const,
}

export function useNotes() {
  const userId = useSession().user.id
  return useQuery({
    queryKey: noteKeys.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw toAppError(error)
      return sortNotes(z.array(NoteSchema).parse(data))
    },
  })
}

export function useAddNote() {
  const userId = useSession().user.id
  const queryClient = useQueryClient()
  return useMutation({
    // Only the body is sent: the database fills in the owner (see the migration).
    mutationFn: async (body: string) => {
      const { error } = await supabase.from('notes').insert({ body })
      if (error) throw toAppError(error)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: noteKeys.all(userId) }),
  })
}

export function useSetNoteDone() {
  const userId = useSession().user.id
  const queryClient = useQueryClient()
  const key = noteKeys.all(userId)
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from('notes').update({ done }).eq('id', id)
      if (error) throw toAppError(error)
    },
    // Tick it straight away, and roll back if the save fails.
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Note[]>(key)
      queryClient.setQueryData<Note[]>(key, (notes) =>
        notes ? sortNotes(notes.map((n) => (n.id === id ? { ...n, done } : n))) : notes,
      )
      return { previous }
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast(errorMessage(err), 'error')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteNote() {
  const userId = useSession().user.id
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw toAppError(error)
    },
    onError: (err) => toast(errorMessage(err), 'error'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: noteKeys.all(userId) }),
  })
}

/** An RPC example: the database deletes finished notes and returns how many. */
export function useClearDone() {
  const userId = useSession().user.id
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => rpcParsed('clear_done_notes', {}, z.number().int()),
    onSuccess: (count) =>
      toast(count === 1 ? 'Cleared 1 note.' : `Cleared ${count} notes.`, 'success'),
    onError: (err) => toast(errorMessage(err), 'error'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: noteKeys.all(userId) }),
  })
}
