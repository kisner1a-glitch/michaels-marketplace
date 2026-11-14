import Stripe from "stripe";

// Server-only Stripe client (uses the sandbox secret key).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);