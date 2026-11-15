import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase, CATEGORIES, formatPrice } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, price, image_url, location")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-[300px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-4 md:block">
        <input
          placeholder="Search Marketplace"
          className="mb-4 w-full rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm outline-none placeholder:text-[var(--muted)]"
        />
        <Link
          href="/create/item"
          className="mb-4 block rounded-lg bg-[var(--accent-soft)] px-4 py-2 text-center font-semibold text-[var(--accent)] hover:opacity-80"
        >
          + Create new listing
        </Link>
        <h2 className="mb-2 mt-6 text-lg font-bold">Categories</h2>
        <ul className="space-y-1">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href={`/category/${encodeURIComponent(c.toLowerCase())}`}
                className="block rounded-lg px-3 py-2 font-medium hover:bg-[var(--surface-2)]"
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main grid */}
      <main className="flex-1 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Today&apos;s picks</h2>
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {listings?.map((l) => (
            <Link key={l.id} href={`/listing/${l.id}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-lg bg-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.image_url}
                  alt={l.title}
                  className="h-full w-full object-cover transition group-hover:opacity-90"
                />
              </div>
              <p className="mt-2 font-bold">{formatPrice(l.price)}</p>
              <p className="truncate text-sm">{l.title}</p>
              {l.location && (
                <p className="truncate text-xs text-[var(--muted)]">{l.location}</p>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}