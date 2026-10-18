// Database functions raise short codes (`raise exception 'not_signed_in'`);
// this turns them, and common Supabase Auth errors, into friendly messages.
const MESSAGES: Record<string, string> = {
  not_signed_in: 'Your session has expired. Sign in again.',
  invalid_credentials: 'That email and password do not match.',
  user_already_exists: 'There is already an account with that email. Sign in instead.',
  email_exists: 'There is already an account with that email.',
  weak_password: 'Choose a stronger password (at least 8 characters).',
  email_not_confirmed: 'Check your inbox and confirm your email first.',
  over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
}

/** An error with a known code and a message safe to show to users. */
export class AppError extends Error {
  readonly code: string
  constructor(code: string, message?: string) {
    super(message ?? MESSAGES[code] ?? 'Something went wrong. Try again.')
    this.code = code
    this.name = 'AppError'
  }
}

/** Converts a Supabase (PostgREST or Auth) error into an AppError. */
export function toAppError(
  error: { message?: string; code?: string } | null | undefined,
): AppError {
  const raised = error?.message?.trim() ?? ''
  if (raised in MESSAGES) return new AppError(raised)
  if (error?.code && error.code in MESSAGES) return new AppError(error.code)
  return new AppError('unknown')
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.'
}
