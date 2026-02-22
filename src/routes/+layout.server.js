export async function load({ locals: { safeGetSession }, cookies }) {
  const { session, user } = await safeGetSession()
  return {
    user,
    isAuthenticated: !!session,
    cookies: cookies.getAll(),
  }
}