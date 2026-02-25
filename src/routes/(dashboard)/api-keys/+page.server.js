import { redirect, fail } from '@sveltejs/kit'
import crypto from 'crypto'

export async function load({ locals: { safeGetSession, supabase } }) {
  const { session, user } = await safeGetSession()
  if (!session) redirect(303, '/auth')

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { keys: keys ?? [] }
}

export const actions = {
  generate: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const form = await request.formData()
    const name = form.get('name')?.toString().trim()

    if (!name) return fail(400, { error: 'Key name is required' })

    // Generate a secure random key, hash it before storing
    const plainKey = `el_${crypto.randomBytes(32).toString('hex')}`
    const keyHash  = crypto.createHash('sha256').update(plainKey).digest('hex')

    const { error: err } = await supabase
      .from('api_keys')
      .insert({ user_id: user.id, name, key_hash: keyHash })

    if (err) return fail(500, { error: 'Failed to create key. Please try again.' })

    // Return plainKey ONCE — never stored, never retrievable again
    return { success: true, newKey: plainKey, newKeyName: name }
  },

  revoke: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession()
    if (!session) redirect(303, '/auth')

    const form = await request.formData()
    const id   = form.get('id')?.toString()

    if (!id) return fail(400, { error: 'Missing key ID' })

    const { error: err } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return fail(500, { error: 'Failed to revoke key' })
    return { revoked: true }
  }
}