import Stripe from 'stripe';

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(key);
}

// Lazy-init to avoid build-time crash when env var is missing
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) _stripe = getStripeClient();
  return _stripe;
}

// Keep backward compat export
export const stripe = typeof process !== 'undefined' && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : (null as unknown as Stripe);

export const PLANS = {
  pro: {
    name: 'Pro',
    price: 1900, // $19/mo in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
  enterprise: {
    name: 'Enterprise',
    price: 4900, // $49/mo in cents
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  },
} as const;
