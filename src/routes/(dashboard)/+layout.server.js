import { redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession } }) {
  const { session } = await safeGetSession()
  if (!session) redirect(303, '/auth')
  return {}
}