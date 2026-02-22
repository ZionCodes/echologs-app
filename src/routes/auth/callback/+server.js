import { redirect } from '@sveltejs/kit'

// Supabase sends users here after:
//   1. Email confirmation after signup
//   2. Password reset link click
// Exchanges the one-time code for a real session (PKCE flow)
export async function GET({ url, locals: { supabase } }) {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (!code) {
    redirect(303, '/auth?error=missing_code')
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    redirect(303, `/auth?error=${encodeURIComponent(error.message)}`)
  }

  // Signup → /dashboard
  // Password reset → /auth/reset-password (passed as ?next param)
  redirect(303, next)
}