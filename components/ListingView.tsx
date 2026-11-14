"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Lightbox from "@/components/Lightbox";
import {
  supabase,
  formatPrice,
  listedAgo,
  inputClass,
  primaryButton,
  type Listing,
} from "@/lib/supabase";

export default function ListingView({ id }: { id: string }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) setListing(data as Listing);
      else setNotFound(true);
      setLoading(false);
    }
    load();
  }, [id]);

  async function send() {
    setError("");
    if (!message.trim()) return setError("Please write a message.");
    if (buyerEmail.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail.trim()))
      return setError("That email doesn't look right.");
    setSending(true);
    const { error: err } = await supabase.from("messages").insert({
      listing_id: Number(id),
      buyer_email: buyerEmail.trim() || null,
      message: message.trim(),
    });
    setSending(false);
    if (err) return setError(err.message);
    setSent(true);
    setMessage("");
  }

  if (loading) return <p className="px-4 py-10">Loading...</p>;

  if (notFound || !listing)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-4">Listing not found.</p>
        <Link href="/" className="font-semibold text-[#1e88e5]">
          Back to Marketplace
        </Link>
      </div>
    );

  const images =
    listing.image_urls && listing.image_urls.length > 0
      ? listing.image_urls
      : listing.image_url
      ? [listing.image_url]
      : [];

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl bg-[#d8dce1]">
          {images.length > 0 ? (
            <button
              type="button"
              onClick={() => setOpen(sel)}
              className="flex w-full cursor-zoom-in justify-center"
              aria-label="View photo full size"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[sel]} alt={listing.title} className="max-h-[70vh] w-full object-contain" />
            </button>
          ) : (
            <span className="text-[#65676b]">No photo</span>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((src, idx) => (
              <button
                key={src}
                type="button"
                onClick={() => setSel(idx)}
                onDoubleClick={() => setOpen(idx)}
                aria-label={`Show photo ${idx + 1}`}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                  idx === sel ? "border-[#1e88e5]" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {images.length > 0 && (
          <p className="mt-1 text-xs text-[#65676b]">Click the big photo to see it full size.</p>
        )}
      </div>

      <aside>
        <h1 className="text-3xl font-extrabold">{listing.title}</h1>
        <p className="text-3xl font-extrabold">{formatPrice(listing.price)}</p>
        <p className="mt-4 text-[#65676b]">
          Listed {listedAgo(listing.created_at)}
          {listing.location ? ` in ${listing.location}` : ""}
        </p>
        <p className="mt-1 text-sm text-[#65676b]">{listing.category}</p>

        <p className="mt-6 whitespace-pre-wrap">{listing.description}</p>

        <p className="mt-6 font-semibold">Seller information</p>
        <p className="break-all text-[#65676b]">{listing.email}</p>

        <p className="mt-6 font-semibold">Send seller a message</p>
        {sent ? (
          <p className="mt-2 rounded-xl bg-green-100 p-3 text-green-800">
            Message sent to the seller!
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            <textarea
              className={inputClass + " h-32"}
              placeholder="I want to buy your item!"
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <input
              className={inputClass}
              type="email"
              placeholder="Your email (optional)"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className={primaryButton + " w-full"} onClick={send} disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        )}
      </aside>

      {open !== null && images.length > 0 && (
        <Lightbox images={images} startIndex={open} onClose={() => setOpen(null)} />
      )}
    </main>
  );
}