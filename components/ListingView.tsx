"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Lightbox from "@/components/Lightbox";
import StarRating from "@/components/StarRating";
import BuyButton from "@/components/BuyButton";
import RelatedListings from "@/components/RelatedListings";
import {
  supabase,
  formatPrice,
  listedAgo,
  inputClass,
  primaryButton,
  type Listing,
} from "@/lib/supabase";

type Review = {
  id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function ListingView({ id }: { id: string }) {
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  // Message to seller
  const [message, setMessage] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Seller + reviews
  const [sellerName, setSellerName] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsError, setReviewsError] = useState("");
  const [tab, setTab] = useState<"details" | "reviews">("details");
  const [sellerReady, setSellerReady] = useState(false);

  // New review form
  const [rating, setRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewThanks, setReviewThanks] = useState(false);

  // Get the seller's name and all of their reviews (we match sellers by lowercase email)
  async function loadSellerAndReviews(email: string) {
    const [sellerRes, reviewsRes] = await Promise.all([
      supabase.from("sellers").select("name, charges_enabled").eq("email", email).maybeSingle(),
      supabase
        .from("reviews")
        .select("id, reviewer_name, rating, comment, created_at")
        .eq("seller_email", email)
        .order("created_at", { ascending: false }),
    ]);

    if (sellerRes.data) {
      setSellerName(sellerRes.data.name);
      setSellerReady(sellerRes.data.charges_enabled === true);
    }
    if (reviewsRes.error) {
      setReviewsError("Couldn't load reviews. Please try again later.");
    } else {
      setReviews(reviewsRes.data as Review[]);
      setReviewsError("");
    }
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        setListing(data as Listing);
        loadSellerAndReviews((data as Listing).email.trim().toLowerCase());
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

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

  async function submitReview() {
    if (!listing) return;
    setReviewError("");
    setReviewThanks(false);
    if (rating === 0) return setReviewError("Please choose a star rating.");

    setSubmittingReview(true);
    const sellerEmail = listing.email.trim().toLowerCase();
    const { error: err } = await supabase.from("reviews").insert({
      listing_id: Number(id),
      seller_email: sellerEmail,
      reviewer_name: reviewerName.trim() || "Buyer",
      rating,
      comment: comment.trim(),
    });
    setSubmittingReview(false);
    if (err) return setReviewError("Couldn't save your review. Please try again.");

    setRating(0);
    setReviewerName("");
    setComment("");
    setReviewThanks(true);
    await loadSellerAndReviews(sellerEmail);
  }

  if (loading) return <p className="px-4 py-10">Loading...</p>;

  if (notFound || !listing)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-4">Listing not found.</p>
        <Link href="/" className="font-semibold text-[#1877f2]">
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

  // Name shown under "Seller information":
  // 1) the name typed on this listing, 2) the seller's saved name, 3) the first part of their email
  const listingSellerName = (
    (listing as Listing & { seller_name?: string | null }).seller_name || ""
  ).trim();
  const displayName = listingSellerName || sellerName || listing.email.split("@")[0];
  const sold = (listing as Listing & { status?: string }).status === "sold";
  const average =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <main className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px_320px]">
      <div>
        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl bg-[#d8dce1]">
          <button type="button" onClick={goBack} aria-label="Close listing" className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl font-bold leading-none shadow-md transition hover:bg-white active:scale-95">&times;</button>
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
                  idx === sel ? "border-[#1877f2]" : "border-transparent"
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

        <div className="mt-4">
          <BuyButton listingId={listing.id} sold={sold} sellerReady={sellerReady} />
        </div>

        {/* Seller information */}
        <div className="mt-6">
          <p className="font-semibold">Seller information</p>
          <p className="mt-1 text-[15px]">{displayName}</p>
          <button
            type="button"
            onClick={() => setTab("reviews")}
            className="mt-1 flex items-center gap-2 text-sm text-[#65676b] hover:underline"
          >
            <StarRating value={average} size={18} />
            <span>
              {reviews.length > 0
                ? `${average.toFixed(1)} (${reviews.length} review${reviews.length === 1 ? "" : "s"})`
                : "No reviews yet"}
            </span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex border-b border-[#ced0d4]">
          {(["details", "reviews"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-[15px] font-bold transition active:scale-95 ${
                tab === t
                  ? "border-[#1877f2] text-[#1877f2]"
                  : "border-transparent text-[#65676b] hover:text-[#1c1e21]"
              }`}
            >
              {t === "details" ? "Details" : `Reviews (${reviews.length})`}
            </button>
          ))}
        </div>

        {tab === "details" ? (
          <p className="mt-4 whitespace-pre-wrap">{listing.description}</p>
        ) : (
          <div className="mt-4">
            {/* Leave a review */}
            <p className="font-semibold">Rate this seller</p>
            <div className="mt-1 flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} size={34} />
              <span className="text-sm text-[#65676b]">{RATING_WORDS[rating]}</span>
            </div>
            <div className="mt-3 space-y-3">
              <input
                className={inputClass}
                placeholder="Your name (optional)"
                maxLength={50}
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
              />
              <textarea
                className={inputClass + " h-24"}
                placeholder="Write a review (optional)"
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
              {reviewThanks && (
                <p className="rounded-xl bg-green-100 p-3 text-green-800">
                  Thanks! Your review was posted.
                </p>
              )}
              <button
                className={primaryButton + " w-full"}
                onClick={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? "Posting..." : "Submit review"}
              </button>
            </div>

            {/* All reviews */}
            <div className="mt-6 space-y-4">
              {reviewsError && <p className="text-sm text-red-600">{reviewsError}</p>}
              {!reviewsError && reviews.length === 0 && (
                <p className="text-[#65676b]">No reviews yet. Be the first to review this seller.</p>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="border-t border-[#d8dce1] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.reviewer_name}</span>
                    <span className="text-xs text-[#65676b]">{listedAgo(r.created_at)}</span>
                  </div>
                  <StarRating value={r.rating} size={16} />
                  {r.comment && <p className="mt-1 whitespace-pre-wrap break-words">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

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
            <div className="related-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto lg:border-l lg:border-[#ced0d4] lg:pl-6 lg:pr-1 [&_a]:rounded-xl [&_a]:bg-white [&_a]:p-2 [&_a]:shadow-[0_1px_4px_rgba(0,0,0,0.18)] [&_a]:transition [&_a:hover]:shadow-[0_3px_10px_rgba(0,0,0,0.22)]">
        <RelatedListings category={listing.category} currentId={listing.id} />
      </div>

      {open !== null && images.length > 0 && (
        <Lightbox images={images} startIndex={open} onClose={() => setOpen(null)} />
      )}
    </main>
  );
}
