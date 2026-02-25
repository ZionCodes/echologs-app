import { redirect, fail } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession } }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')
  return { user }
}

export const actions = {
  changePassword: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const form    = await request.formData()
    const pass    = form.get('password')?.toString()
    const confirm = form.get('confirm_password')?.toString()

    if (!pass || pass.length < 8)
      return fail(400, { error: 'Password must be at least 8 characters' })
    if (pass !== confirm)
      return fail(400, { error: 'Passwords do not match' })

    const { error } = await supabase.auth.updateUser({ password: pass })
    if (error) return fail(500, { error: error.message })

    return { success: true, message: 'Password updated successfully.' }
  }
}