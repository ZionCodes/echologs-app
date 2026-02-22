import { fail, redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession } }) {
  const { session } = await safeGetSession()
  // No session = reset link was invalid or already used
  if (!session) redirect(303, '/auth/forgot-password')
  return {}
}

export const actions = {
  default: async ({ request, locals: { supabase } }) => {
    const form     = await request.formData()
    const password = form.get('password')?.toString()
    const confirm  = form.get('confirm_password')?.toString()

    if (!password || !confirm)   return fail(400, { error: 'Both fields are required.' })
    if (password.length < 8)     return fail(400, { error: 'Password must be at least 8 characters.' })
    if (password !== confirm)    return fail(400, { error: 'Passwords do not match.' })

    // User is already authenticated via the reset link session
    // updateUser() sets the new password — per Supabase docs
    const { error } = await supabase.auth.updateUser({ password })

    if (error) return fail(400, { error: error.message })

    return { success: true, message: 'Password updated successfully.' }
  },
}