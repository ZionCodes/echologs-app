export const PLANS = {
  free: {
    name:           'Free',
    price_monthly:  0,
    price_yearly:   0,
    executions:     1_000,  // raised from 500
    scripts:        3,
    api_keys:       2,
    retention_days: 14,     // raised from 7
    slack_alerts:   false,
    email_alerts:   true,   // free users get email alerts
    realtime:       false,
    team_members:   1,
  },
  pro: {
    name:           'Pro',
    price_monthly:  8,
    price_yearly:   64,
    executions:     10_000,
    scripts:        25,
    api_keys:       10,
    retention_days: 90,
    slack_alerts:   true,
    email_alerts:   true,
    realtime:       true,
    team_members:   1,
  },
  team: {
    name:           'Team',
    price_monthly:  29,
    price_yearly:   232,
    executions:     Infinity,
    scripts:        Infinity,
    api_keys:       Infinity,
    retention_days: 365,
    slack_alerts:   true,
    email_alerts:   true,
    realtime:       true,
    team_members:   10,
  },
}

export function getLimits(plan) {
  return PLANS[plan] ?? PLANS.free
}

export function canUseFeature(plan, feature) {
  return getLimits(plan)[feature] === true
}

export function withinLimit(plan, key, currentCount) {
  const max = getLimits(plan)[key]
  if (max === Infinity) return true
  return currentCount < max
}

export function limitLabel(plan, key) {
  const val = getLimits(plan)[key]
  if (val === Infinity)         return 'Unlimited'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  return val.toLocaleString()
}

export function upgradeMessage(plan, key) {
  if (plan === 'team') return null
  const messages = {
    executions:   'You have reached your monthly execution limit. Upgrade to continue.',
    scripts:      'You have reached your script limit. Upgrade to monitor more scripts.',
    api_keys:     'You have reached your API key limit. Upgrade to create more keys.',
    slack_alerts: 'Slack alerts are available on Pro and Team plans.',
    email_alerts: 'Email alerts are available on Pro and Team plans.',
    realtime:     'Realtime streaming is available on Pro and Team plans.',
  }
  return messages[key] ?? 'Upgrade your plan to access this feature.'
}