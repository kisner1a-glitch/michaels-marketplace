"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { inputClass, primaryButton } from "@/lib/supabase";

export default function ConnectForm() {
  const params = useSearchParams();
  const done = params.get("done");
  const refresh = params.get("refresh");
  const returnedEmail = params.get("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "pending">("idle");

  // After Stripe sends the seller back, ask our server to check the account
  useEffect(() => {
    if (!done || !returnedEmail) return;
    fetch("/api/stripe/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: returnedEmail }),
    })
      .then((r) => r.json())
      .then((d) => setStatus(d.ready ? "ready" : "pending"))
      .catch(() => setStatus("pending"));
  }, [done, returnedEmail]);

  async function start() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      // Send the seller to Stripe's hosted onboarding page
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-3 px-4 py-8">
      <h1 className="text-2xl font-extrabold">Connect with Stripe</h1>
      <p className="text-[#65676b]">
        Get paid when your items sell. Use the same email as your listings.
      </p>

      {done && status === "idle" && (
        <p className="rounded-lg bg-gray-100 p-3">Checking your account...</p>
      )}
      {done && status === "ready" && (
        <p className="rounded-lg bg-green-100 p-3 text-green-800">
          You&apos;re all set! Your listings now show a Buy now button.
        </p>
      )}
      {done && status === "pending" && (
        <p className="rounded-lg bg-yellow-100 p-3 text-yellow-800">
          Stripe is still checking your details. Refresh this page in a minute.
        </p>
      )}
      {refresh && (
        <p className="rounded-lg bg-yellow-100 p-3 text-yellow-800">
          Your setup link expired. Enter your details again to continue.
        </p>
      )}

      <input
        className={inputClass}
        placeholder="Your name"
        maxLength={80}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={inputClass}
        placeholder="Email (same as your listings)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={primaryButton} onClick={start} disabled={loading}>
        {loading ? "Redirecting to Stripe..." : "Connect with Stripe"}
      </button>
    </div>
  );
}