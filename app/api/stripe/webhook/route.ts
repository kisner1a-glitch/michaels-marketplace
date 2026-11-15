import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    console.error("webhook: not configured", {
      hasSecret: !!secret,
      hasSignature: !!signature,
    });
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  // 1. Verify the request really came from Stripe (needs the RAW body text)
  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    // Temporary diagnostics: never logs the secret itself, only its shape
    console.error("webhook: signature check failed", {
      message: e instanceof Error ? e.message : String(e),
      secretLength: secret.length, // a correct whsec_ secret has 38 characters
      startsWithWhsec: secret.startsWith("whsec_"),
      hasWhitespace: /\s/.test(secret),
      hasBacktickOrQuote: /[`"']/.test(secret),
    });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // 2. A payment finished: save the order and mark the listing Sold
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const connectedAccount = event.account; // the seller's Stripe account
    const listingId = Number(session.metadata?.listing_id);

    // The sandbox is shared with other apps: ignore anything that isn't ours
    if (session.payment_status === "paid" && connectedAccount && listingId) {
      const { data: listing } = await supabaseAdmin
        .from("listings")
        .select("id, email")
        .eq("id", listingId)
        .maybeSingle();

      const sellerEmail = listing ? String(listing.email).toLowerCase() : "";
      const { data: seller } = await supabaseAdmin
        .from("sellers")
        .select("stripe_account_id")
        .eq("email", sellerEmail)
        .maybeSingle();

      // Only continue if this listing's seller is the account that got paid
      if (listing && seller?.stripe_account_id === connectedAccount) {
        // Ask Stripe how much fee we actually kept
        let fee = 0;
        if (typeof session.payment_intent === "string") {
          const pi = await stripe.paymentIntents.retrieve(
            session.payment_intent,
            {},
            { stripeAccount: connectedAccount }
          );
          fee = pi.application_fee_amount ?? 0;
        }

        // stripe_session_id is unique, so a repeated webhook can't create a duplicate
        const { error: orderError } = await supabaseAdmin.from("orders").upsert(
          {
            listing_id: listing.id,
            seller_email: sellerEmail,
            buyer_email: session.customer_details?.email ?? null,
            amount_cents: session.amount_total ?? 0,
            platform_fee_cents: fee,
            currency: session.currency ?? "usd",
            stripe_session_id: session.id,
            stripe_account_id: connectedAccount,
            status: "paid",
          },
          { onConflict: "stripe_session_id", ignoreDuplicates: true }
        );
        if (orderError) {
          console.error("webhook: saving order failed", orderError.message);
          // Non-200 makes Stripe retry later
          return NextResponse.json({ error: orderError.message }, { status: 500 });
        }

        await supabaseAdmin
          .from("listings")
          .update({ status: "sold" })
          .eq("id", listing.id);
      } else {
        console.error("webhook: event skipped, seller does not match", {
          listingFound: !!listing,
          sellerFound: !!seller,
        });
      }
    }
  }

  // 3. A seller's Stripe account changed: keep charges_enabled up to date
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    await supabaseAdmin
      .from("sellers")
      .update({ charges_enabled: account.charges_enabled === true })
      .eq("stripe_account_id", account.id);
  }

  // Always answer 200 for events we don't care about
  return NextResponse.json({ received: true });
}