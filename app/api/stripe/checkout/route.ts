import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const FEE_PERCENT = 10; // platform fee

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = Number(body.listingId);
  if (!listingId) {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }

  // 1. Load the listing from our own database (never trust the browser's price)
  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("id, title, price, email, status, image_url")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (listing.status === "sold") {
    return NextResponse.json({ error: "This item is already sold." }, { status: 400 });
  }

  // 2. The seller must be onboarded and ready to take payments
  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("stripe_account_id, charges_enabled")
    .eq("email", String(listing.email).toLowerCase())
    .maybeSingle();

  if (!seller?.stripe_account_id || !seller.charges_enabled) {
    return NextResponse.json(
      { error: "This seller hasn't set up payments yet." },
      { status: 400 }
    );
  }

  // 3. Work in cents (Stripe uses whole cents) and take 10%
  const amount = Math.round(Number(listing.price) * 100);
  if (!(amount >= 50)) {
    return NextResponse.json(
      { error: "Price must be at least $0.50 to pay by card." },
      { status: 400 }
    );
  }
  const fee = Math.round((amount * FEE_PERCENT) / 100);

  try {
    const origin = new URL(req.url).origin;

    // 4. Direct charge: the session is created ON the seller's account
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        // Keep the price in USD (no automatic currency conversion)
        adaptive_pricing: { enabled: false },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: listing.title,
                ...(listing.image_url ? { images: [listing.image_url] } : {}),
              },
            },
          },
        ],
        payment_intent_data: { application_fee_amount: fee },
        metadata: { listing_id: String(listing.id) },
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/listing/${listing.id}?canceled=1`,
      },
      { stripeAccount: seller.stripe_account_id }
    );

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
