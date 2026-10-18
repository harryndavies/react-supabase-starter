import type { z } from 'zod'

/** First error message for each field, for showing under the inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    out[key] ??= issue.message
  }
  return out
}

/** The first error message, for single-field forms. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Check this and try again.'
}
