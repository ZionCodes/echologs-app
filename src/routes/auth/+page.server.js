import { redirect, fail } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession } }) {
  const { session } = await safeGetSession()
  // Already logged in — go straight to dashboard
  if (session) redirect(303, '/')
  return {}
}

export const actions = {

  signup: async ({ request, locals: { supabase }, url }) => {
    const form     = await request.formData()
    const email    = form.get('email')?.toString().trim()
    const password = form.get('password')?.toString()

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required.', mode: 'signup' })
    }
    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters.', mode: 'signup' })
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${url.origin}/auth/callback`,
      },
    })

    if (error) return fail(400, { error: error.message, mode: 'signup' })

    return {
      success: true,
      message: 'Check your email and click the confirmation link to activate your account.',
    }
  },

  login: async ({ request, locals: { supabase } }) => {
    const form     = await request.formData()
    const email    = form.get('email')?.toString().trim()
    const password = form.get('password')?.toString()

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required.', mode: 'login' })
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return fail(400, { error: error.message, mode: 'login' })

    redirect(303, '/dashboard')
  },

  signout: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut()
    redirect(303, '/auth')
  },
}