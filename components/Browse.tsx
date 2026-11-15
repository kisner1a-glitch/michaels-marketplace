"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, CATEGORIES, slugify, formatPrice, type Listing } from "@/lib/supabase";

export default function Browse({ category }: { category?: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      let query = supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (cancelled) return;
      if (error) setError(error.message);
      else setListings((data as Listing[]) ?? []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [category]);

  const term = search.trim().toLowerCase();
  const shown = term
    ? listings.filter(
        (l) =>
          l.title.toLowerCase().includes(term) ||
          l.description.toLowerCase().includes(term)
      )
    : listings;

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <Link
          href="/create"
          className="mb-4 block rounded-xl bg-[#1e88e5] px-4 py-2.5 text-center font-bold text-white hover:bg-[#1976d2]"
        >
          + Create new listing
        </Link>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings"
          className="mb-4 w-full rounded-xl border border-[#c4c9d0] bg-white px-3 py-2.5 text-[15px] focus:border-[#1e88e5] focus:outline-none focus:ring-2 focus:ring-[#1e88e5]/30"
        />
        <h2 className="mb-2 text-xl font-bold">Categories</h2>
        <nav className="flex flex-col">
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <Link
                key={c}
                href={`/category/${slugify(c)}`}
                className={`rounded-lg px-3 py-1.5 text-[15px] ${
                  active
                    ? "bg-[#1e88e5]/15 font-bold text-[#1e88e5]"
                    : "text-[#1c1e21] hover:bg-black/5"
                }`}
              >
                {c}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 flex-1">
        <h1 className="mb-4 text-2xl font-bold">{category ?? "Today's picks"}</h1>

        {loading && <p className="text-[#65676b]">Loading listings...</p>}
        {error && <p className="text-red-600">Could not load listings: {error}</p>}
        {!loading && !error && shown.length === 0 && (
          <p className="text-[#65676b]">No listings found.</p>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((l) => (
            <Link key={l.id} href={`/listing/${l.id}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-xl bg-[#d8dce1]">
                {l.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.image_url}
                    alt={l.title}
                    className="h-full w-full object-cover group-hover:opacity-90"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#65676b]">
                    No photo
                  </div>
                )}
              </div>
              <p className="mt-2 text-lg font-semibold">{formatPrice(l.price)}</p>
              <p className="truncate text-[15px]">{l.title}</p>
              <p className="truncate text-sm text-[#65676b]">{l.location || l.category}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}