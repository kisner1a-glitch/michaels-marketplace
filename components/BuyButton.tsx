"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { primaryButton } from "@/lib/supabase";

export default function BuyButton({
  listingId,
  sold,
  sellerReady,
}: {
  listingId: number;
  sold: boolean;
  sellerReady: boolean;
}) {
  const canceled = useSearchParams().get("canceled");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      // Go to Stripe's hosted payment page
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (sold) {
    return (
      <button disabled className={`${primaryButton} w-full opacity-60`}>
        Sold
      </button>
    );
  }

  if (!sellerReady) {
    return (
      <p className="rounded-lg bg-gray-100 p-3 text-center text-sm text-[#65676b]">
        Seller hasn&apos;t set up payments yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {canceled && (
        <p className="rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800">
          No worries, you weren&apos;t charged. You can buy it whenever you&apos;re ready.
        </p>
      )}
      <button
        onClick={buy}
        disabled={loading}
        className={`${primaryButton} w-full`}
      >
        {loading ? "Redirecting to secure checkout..." : "Buy now"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}