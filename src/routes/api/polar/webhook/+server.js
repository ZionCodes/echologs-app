import { json }                 from '@sveltejs/kit'
import { createHmac }           from 'crypto'
import { supabaseAdmin }        from '$lib/server/supabase-admin.js'
import { POLAR_PRODUCTS }       from '$lib/polar.js'
import { POLAR_WEBHOOK_SECRET } from '$env/static/private'

// ── Polar signature format ────────────────────────────────────────────────
// Signed content = "{webhook-id}.{webhook-timestamp}.{rawBody}"
// Expected header = "v1,<base64-hmac-sha256>"  (space-separated if multiple)
function verifySignature(rawBody, headers) {
  const webhookId        = headers.get('webhook-id')
  const webhookTimestamp = headers.get('webhook-timestamp')
  const webhookSignature = headers.get('webhook-signature')

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error('[Polar] Missing signature headers', {
      webhookId:        !!webhookId,
      webhookTimestamp: !!webhookTimestamp,
      webhookSignature: !!webhookSignature,
    })
    return false
  }

  // Reject webhooks older than 5 minutes
  const ts  = parseInt(webhookTimestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > 300) {
    console.error('[Polar] Webhook timestamp too old:', { ts, now })
    return false
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`

  const expected = 'v1,' + createHmac('sha256', POLAR_WEBHOOK_SECRET)
    .update(signedContent)
    .digest('base64')

  // Polar can send multiple signatures space-separated — any match is valid
  const valid = webhookSignature.split(' ').some(sig => sig === expected)

  if (!valid) {
    console.error('[Polar] Signature mismatch', {
      expected,
      received: webhookSignature,
    })
  }

  return valid
}

// ── Find Supabase user by email ───────────────────────────────────────────
async function getUserIdByEmail(email) {
  if (!email) {
    console.error('[Polar] No email provided to getUserIdByEmail')
    return null
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) {
    console.error('[Polar] Error listing users:', error)
    return null
  }

  const user = data.users.find(u => u.email === email)
  if (!user) {
    console.error('[Polar] No Supabase user found for email:', email)
    return null
  }

  return user.id
}

// ── Webhook handler ───────────────────────────────────────────────────────
export const POST = async ({ request }) => {
  // Read raw body ONCE — must be before any other body access
  const rawBody = await request.text()

  if (!verifySignature(rawBody, request.headers)) {
    return json({ error: 'Invalid signature' }, { status: 403 })
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data } = event
  console.log('[Polar] Event:', type, '| product:', data?.product_id)

  try {
    switch (type) {

      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active': {
        const product = POLAR_PRODUCTS[data?.product_id]
        if (!product) {
          console.warn('[Polar] Unknown product_id:', data?.product_id)
          break
        }

        // Email is at data.customer.email per Polar's actual payload
        const email  = data?.customer?.email
        const userId = await getUserIdByEmail(email)
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

        console.log(`[Polar] ${type} → ${email} → ${product.plan} (${data.status})`)
        break
      }

      case 'subscription.canceled':
      case 'subscription.revoked': {
        const email  = data?.customer?.email
        const userId = await getUserIdByEmail(email)
        if (!userId) break

        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan:       'free',
            status:     'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        console.log(`[Polar] ${type} → ${email} → downgraded to free`)
        break
      }

      case 'order.created': {
        const product = POLAR_PRODUCTS[data?.product_id]
        if (!product || product.type !== 'lifetime') {
          console.log('[Polar] order.created ignored — not lifetime:', data?.product_id)
          break
        }

        const email  = data?.customer?.email
        const userId = await getUserIdByEmail(email)
        if (!userId) break

        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id:            userId,
            plan:               product.plan,
            status:             'active',
            polar_customer_id:  data.customer_id,
            polar_order_id:     data.id,
            current_period_end: null, // lifetime — never expires
            updated_at:         new Date().toISOString(),
          }, { onConflict: 'user_id' })

        console.log(`[Polar] Lifetime order → ${email} → ${product.plan}`)
        break
      }

      default:
        console.log('[Polar] Unhandled event type:', type)
    }
  } catch (err) {
    console.error('[Polar] Handler error:', err)
    return json({ error: 'Internal error' }, { status: 500 })
  }

  return json({ ok: true })
}