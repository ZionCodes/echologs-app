export async function load({ locals: { safeGetSession, supabase }, cookies }) {
  const { session, user } = await safeGetSession()

  if (!session) {
    return {
      user,
      isAuthenticated: false,
      cookies: cookies.getAll(),
      plan: 'free',
      subscription: null,
    }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const plan = (
    subscription?.status === 'active' ||
    subscription?.status === 'trialing'
  )
    ? (subscription.plan ?? 'free')
    : 'free'

  return {
    user,
    isAuthenticated: !!session,
    cookies: cookies.getAll(),
    plan,
    subscription: subscription ?? null,
  }
}