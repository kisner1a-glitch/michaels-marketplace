import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name) {
    return NextResponse.json(
      { error: "Please enter your name and a valid email." },
      { status: 400 }
    );
  }

  // Only people who have a listing can become sellers
  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("id")
    .ilike("email", email)
    .limit(1);
  if (!listing || listing.length === 0) {
    return NextResponse.json(
      { error: "No listing found with that email. Create a listing first." },
      { status: 404 }
    );
  }

  try {
    // Reuse the Stripe account if this seller already started onboarding
    const { data: existing } = await supabaseAdmin
      .from("sellers")
      .select("stripe_account_id")
      .eq("email", email)
      .maybeSingle();

    let accountId = existing?.stripe_account_id as string | undefined;

    if (!accountId) {
      const account = await stripe.accounts.create({ type: "standard", email });
      accountId = account.id;
      const { error } = await supabaseAdmin
        .from("sellers")
        .upsert({ email, name, stripe_account_id: accountId }, { onConflict: "email" });
      if (error) throw new Error(error.message);
    }

    // One-time link to Stripe's hosted onboarding page
    const origin = new URL(req.url).origin;
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${origin}/connect?refresh=1`,
            return_url: `${origin}/connect?done=1&email=${encodeURIComponent(email)}`,
    });

    return NextResponse.json({ url: link.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}