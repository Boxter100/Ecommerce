import Stripe from 'stripe';
import { envStripeSecretKey } from './env';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(envStripeSecretKey(), {
      apiVersion: '2026-08-26.dahlia',
      appInfo: {
        name: 'Vuelta Store',
        version: '0.1.0',
      },
    });
  }
  return _stripe;
}