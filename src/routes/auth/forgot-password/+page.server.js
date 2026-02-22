import { fail } from '@sveltejs/kit'

export const actions = {
  default: async ({ request, locals: { supabase }, url }) => {
    const form  = await request.formData()
    const email = form.get('email')?.toString().trim()

    if (!email) return fail(400, { error: 'Please enter your email address.' })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Supabase hits /auth/callback which exchanges the code,
      // then the ?next param sends user to /auth/reset-password
      redirectTo: `${url.origin}/auth/callback?next=/auth/reset-password`,
    })

    // Always show success — never confirm whether an email exists
    if (error) console.error('Password reset error:', error.message)

    return {
      success: true,
      message: "If that email is registered, you'll receive a reset link shortly.",
    }
  },
}