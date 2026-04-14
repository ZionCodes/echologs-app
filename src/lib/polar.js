const APP_URL = 'https://app.echologs.com'

// ── Live product IDs from polar.sh ────────────────────────────────────────
export const POLAR_PRODUCTS = {
  'e67e44c3-ba87-4b98-b5ba-2ed8a7351fca': { plan: 'pro',  type: 'monthly'  },
  'a0d8202d-8ad9-4d88-ab06-7ed45081e601': { plan: 'pro',  type: 'yearly'   },
  '12faaec6-4dc9-40d1-8f94-69884eec51b1': { plan: 'pro',  type: 'lifetime' },
  '0c6f831b-3777-42b3-af61-ddad24a07722': { plan: 'team', type: 'monthly'  },
  '0592f8df-bb0c-4cab-a421-c5624648135f': { plan: 'team', type: 'yearly'   },
  '5f2eb355-4ee6-49b3-ad40-613898e99eb0': { plan: 'team', type: 'lifetime' },
}

// ── Checkout links — with success + return URLs appended ─────────────────
// Polar appends ?checkout_id=... on success automatically when {CHECKOUT_ID} is present
const success = encodeURIComponent(`${APP_URL}/account?upgrade=success&checkout_id={CHECKOUT_ID}`)
const back    = encodeURIComponent(`${APP_URL}/account`)

export const POLAR_CHECKOUT_LINKS = {
  pro_monthly:   `https://buy.polar.sh/polar_cl_jBlBGGMd9HiFYvByuhzQiHW8Vb1LS5SIOTpQ505VGr9?successUrl=${success}&returnUrl=${back}`,
  pro_yearly:    `https://buy.polar.sh/polar_cl_G4OvmtjbUhUIxlhPxyLclphLO2YjeQ8zFmi6a39sm9I?successUrl=${success}&returnUrl=${back}`,
  pro_lifetime:  `https://buy.polar.sh/polar_cl_bdqiX6zAdIvyaLi6uMeEn2t5ETs2k8JFq04Kj342Cxi?successUrl=${success}&returnUrl=${back}`,
  team_monthly:  `https://buy.polar.sh/polar_cl_qwrSrUwV4oiguuEqZ41c39HtfagByb9L1WDx420eo2z?successUrl=${success}&returnUrl=${back}`,
  team_yearly:   `https://buy.polar.sh/polar_cl_T6ZH8rSuFwxApOcZIZatVvKYD6bNK5LrLY9lw06dbQo?successUrl=${success}&returnUrl=${back}`,
  team_lifetime: `https://buy.polar.sh/polar_cl_Wv6iFcPTmBmqaCZfm8ewcSstum9jzA9ANSVpQ1FMFxv?successUrl=${success}&returnUrl=${back}`,
}