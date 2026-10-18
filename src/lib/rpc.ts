import type { z } from 'zod'
import type { Database } from './database.types'
import { toAppError } from './errors'
import { supabase } from './supabase'

type Fns = Database['public']['Functions']
export type RpcName = keyof Fns

/** Calls a database function, throwing an AppError on failure. */
export async function rpc<N extends RpcName>(name: N, args: Fns[N]['Args']): Promise<unknown> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw toAppError(error)
  return data
}

/** Calls a database function and validates what it returns. */
export async function rpcParsed<N extends RpcName, S extends z.ZodType>(
  name: N,
  args: Fns[N]['Args'],
  schema: S,
): Promise<z.infer<S>> {
  return schema.parse(await rpc(name, args))
}
