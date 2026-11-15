import { Suspense } from "react";
import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatPrice } from "@/lib/supabase";

async function OrderStatus({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return <p>We couldn&apos;t find your order.</p>;
  }

  // Orders are only readable by our server (visitors have no access)
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("listing_id, amount_cents")
    .eq("stripe_session_id", session_id)
    .maybeSingle();

  // The webhook may need a few seconds to save the order
  if (!order) {
    return (
      <>
        <AutoRefresh />
        <h1 className="text-2xl font-extrabold">Payment received</h1>
        <p className="mt-2 text-[#65676b]">Confirming your order...</p>
      </>
    );
  }

  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("title")
    .eq("id", order.listing_id)
    .maybeSingle();

  return (
    <>
      <h1 className="text-2xl font-extrabold">Thank you! Your order is confirmed</h1>
      <p className="mt-3">
        <span className="font-semibold">{listing?.title ?? "Your item"}</span>
      </p>
      <p className="text-[#65676b]">Paid {formatPrice(order.amount_cents / 100)}</p>
      <p className="mt-3 text-[#65676b]">
        The seller has been paid and the listing is now marked as Sold.
      </p>
      <Link
        href={`/listing/${order.listing_id}`}
        className="mt-4 inline-block font-semibold text-[#1877f2]"
      >
        View the listing
      </Link>
    </>
  );
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Suspense fallback={<p>Loading...</p>}>
        <OrderStatus searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
