import { json }             from '@sveltejs/kit'
import crypto               from 'crypto'
import { supabaseAdmin }    from '$lib/server/supabase-admin.js'
import { POLAR_PRODUCTS }   from '$lib/polar.js'
import { POLAR_WEBHOOK_SECRET } from '$env/static/private'

function verifySignature(payload, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return `sha256=${hmac}` === signature
}

async function getUserIdByEmail(email) {
  if (!email) return null
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) return null
  return data.users.find(u => u.email === email)?.id ?? null
}

export const POST = async ({ request }) => {
  const rawBody   = await request.text()
  const signature = request.headers.get('webhook-signature') ?? ''

  if (!verifySignature(rawBody, signature, POLAR_WEBHOOK_SECRET)) {
    console.error('[Polar] Invalid signature')
    return json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data } = event
  console.log('[Polar] Event received:', type)

  try {
    switch (type) {

      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active': {
        const product = POLAR_PRODUCTS[data.product_id]
        if (!product) break

        const userId = await getUserIdByEmail(data.user?.email)
        if (!userId) break

        const isActive = ['active', 'trialing'].includes(data.status)

        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id:               userId,
            plan:                  isActive ? product.plan : 'free',
            status:                data.status,
            polar_customer_id:     data.customer_id,
            polar_subscription_id: data.id,
            current_period_end:    data.current_period_end ?? null,
            updated_at:            new Date().toISOString(),
          }, { onConflict: 'user_id' })

        console.log(`[Polar] ${type} — ${data.user?.email} → ${product.plan}`)
        break
      }

      case 'subscription.canceled':
      case 'subscription.revoked': {
        const userId = await getUserIdByEmail(data.user?.email)
        if (!userId) break

        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan:       'free',
            status:     'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        console.log(`[Polar] ${type} — ${data.user?.email} → free`)
        break
      }

      case 'order.created': {
        const product = POLAR_PRODUCTS[data.product_id]
        if (!product || product.type !== 'lifetime') break

        const userId = await getUserIdByEmail(data.user?.email)
        if (!userId) break

        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id:            userId,
            plan:               product.plan,
            status:             'active',
            polar_customer_id:  data.customer_id,
            polar_order_id:     data.id,
            current_period_end: null,
            updated_at:         new Date().toISOString(),
          }, { onConflict: 'user_id' })

        console.log(`[Polar] Lifetime order — ${data.user?.email} → ${product.plan}`)
        break
      }

      default:
        console.log('[Polar] Unhandled event:', type)
    }
  } catch (err) {
    console.error('[Polar] Handler error:', err)
    return json({ error: 'Internal error' }, { status: 500 })
  }

  return json({ ok: true })
}