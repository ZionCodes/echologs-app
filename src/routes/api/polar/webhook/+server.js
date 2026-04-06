import { json }                 from '@sveltejs/kit'
import { createHmac }           from 'crypto'
import { supabaseAdmin }        from '$lib/server/supabase-admin.js'
import { POLAR_PRODUCTS }       from '$lib/polar.js'
import { POLAR_WEBHOOK_SECRET } from '$env/static/private'

// ── Signature verification — identical to confirmed working polar-test ─────
// Polar signs: "webhook-id.webhook-timestamp.rawBody"
// Header format: "v1,<base64-hmac-sha256>"
function verifySignature(rawBody, headers) {
  const id        = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const signature = headers.get('webhook-signature')

  if (!id || !timestamp || !signature) {
    console.error('[Polar] Missing headers:', { id: !!id, timestamp: !!timestamp, signature: !!signature })
    return false
  }

  // Reject webhooks older than 5 minutes
  const ts  = parseInt(timestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > 300) {
    console.error('[Polar] Timestamp too old:', Math.abs(now - ts), 'seconds')
    return false
  }

  const signed   = `${id}.${timestamp}.${rawBody}`
  const expected = 'v1,' + createHmac('sha256', POLAR_WEBHOOK_SECRET)
    .update(signed)
    .digest('base64')

  const valid = signature.split(' ').some(s => s === expected)

  if (!valid) {
    console.error('[Polar] Signature mismatch')
    console.error('  Expected:', expected)
    console.error('  Received:', signature)
  }

  return valid
}

// ── Find Supabase user by email ───────────────────────────────────────────
async function getUserIdByEmail(email) {
  if (!email) {
    console.error('[Polar] No email provided')
    return null
  }

  console.log('[Polar] Looking up user:', email)

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
    page:    1,
  })

  if (error) {
    console.error('[Polar] listUsers error:', error.message)
    return null
  }

  const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    console.error('[Polar] User not found. Checked:', data.users.length, 'users')
    return null
  }

  console.log('[Polar] Found user:', user.id)
  return user.id
}

// ── Write to Supabase ─────────────────────────────────────────────────────
async function upsertSubscription(userId, plan, status, extra = {}) {
  console.log('[Polar] Upserting:', { userId, plan, status })

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id:    userId,
      plan,
      status,
      updated_at: new Date().toISOString(),
      ...extra,
    }, { onConflict: 'user_id' })
    .select()

  if (error) {
    console.error('[Polar] Upsert error:', error.message, error.details ?? '')
    return false
  }

  console.log('[Polar] Upsert OK:', JSON.stringify(data))
  return true
}

// ── Webhook handler ───────────────────────────────────────────────────────
export const POST = async ({ request }) => {
  // Must read raw body first — before any other access
  const rawBody = await request.text()

  console.log('\n[Polar] ══ Webhook received', new Date().toISOString())

  // Verify signature
  if (!verifySignature(rawBody, request.headers)) {
    return json({ error: 'Invalid signature' }, { status: 403 })
  }

  console.log('[Polar] ✓ Signature valid')

  // Parse body
  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data } = event
  const email = data?.customer?.email ?? data?.user?.email

  console.log('[Polar] Type:   ', type)
  console.log('[Polar] Email:  ', email)
  console.log('[Polar] Product:', data?.product_id)
  console.log('[Polar] Status: ', data?.status)

  try {
    switch (type) {

      // ── Active subscriptions ───────────────────────────────────────────
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active': {
        const product = POLAR_PRODUCTS[data?.product_id]

        if (!product) {
          console.warn('[Polar] Unknown product_id:', data?.product_id)
          console.warn('[Polar] Known IDs:', Object.keys(POLAR_PRODUCTS).join(', '))
          break
        }

        const userId = await getUserIdByEmail(email)
        if (!userId) break

        const isActive = ['active', 'trialing'].includes(data.status)
        const plan     = isActive ? product.plan : 'free'

        await upsertSubscription(userId, plan, data.status, {
          polar_customer_id:     data.customer_id,
          polar_subscription_id: data.id,
          current_period_end:    data.current_period_end ?? null,
        })

        console.log(`[Polar] ✓ ${type} → ${email} → ${plan} (${data.status})`)
        break
      }

      // ── Canceled / revoked ─────────────────────────────────────────────
      case 'subscription.canceled':
      case 'subscription.revoked': {
        const userId = await getUserIdByEmail(email)
        if (!userId) break

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            plan:       'free',
            status:     'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (error) {
          console.error('[Polar] Cancel error:', error.message)
        } else {
          console.log(`[Polar] ✓ ${type} → ${email} → free (canceled)`)
        }
        break
      }

      // ── Lifetime one-time orders ───────────────────────────────────────
      case 'order.created': {
        const product = POLAR_PRODUCTS[data?.product_id]

        if (!product) {
          console.warn('[Polar] Unknown product_id in order:', data?.product_id)
          break
        }

        if (product.type !== 'lifetime') {
          console.log('[Polar] order.created — not lifetime, skipping')
          break
        }

        const userId = await getUserIdByEmail(email)
        if (!userId) break

        await upsertSubscription(userId, product.plan, 'active', {
          polar_customer_id:  data.customer_id,
          polar_order_id:     data.id,
          current_period_end: null, // lifetime — never expires
        })

        console.log(`[Polar] ✓ Lifetime order → ${email} → ${product.plan}`)
        break
      }

      default:
        console.log('[Polar] Unhandled event type:', type)
    }
  } catch (err) {
    console.error('[Polar] Unexpected error:', err.message)
    return json({ error: 'Internal error' }, { status: 500 })
  }

  // Always return 200 — Polar retries on non-200 responses
  return json({ ok: true })
}