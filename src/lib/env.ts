import { z } from 'zod'

// Checked once at start-up, so a missing value fails loudly instead of as a vague
// network error later.
const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10),
  /** Optional: without it, the notifications switch is hidden. */
  VITE_VAPID_PUBLIC_KEY: z.string().optional(),
})

const parsed = EnvSchema.safeParse(import.meta.env)
if (!parsed.success) {
  throw new Error(
    `Missing or invalid environment variables (${parsed.error.issues
      .map((i) => i.path.join('.'))
      .join(', ')}). Copy .env.example to .env.local.`,
  )
}

export const env = parsed.data
