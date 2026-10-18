import { z } from 'zod'

export const EmailSchema = z.email('Enter a valid email address.')
export const PasswordSchema = z.string().min(8, 'Use at least 8 characters.')
export const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a name.')
  .max(40, 'Keep it to 40 characters.')

export const SignInSchema = z.object({ email: EmailSchema, password: PasswordSchema })
export const SignUpSchema = SignInSchema.extend({ displayName: DisplayNameSchema })
export const GuestSchema = z.object({ displayName: DisplayNameSchema })

/** Only same-site paths, so ?redirect= can never send someone to another site. */
export const RedirectSchema = z
  .string()
  .regex(/^\/(?!\/)/)
  .optional()
  .catch(undefined)
