import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();

  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("stripe_account_id")
    .eq("email", email)
    .maybeSingle();

  if (!seller?.stripe_account_id) {
    return NextResponse.json({ error: "Seller not found." }, { status: 404 });
  }

  try {
    // Ask Stripe for the real status, never trust the browser
    const account = await stripe.accounts.retrieve(seller.stripe_account_id);
    const ready = account.charges_enabled === true;

    await supabaseAdmin
      .from("sellers")
      .update({ charges_enabled: ready })
      .eq("email", email);

    return NextResponse.json({ ready });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}