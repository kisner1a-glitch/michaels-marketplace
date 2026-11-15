"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, formatPrice } from "@/lib/supabase";

type Item = {
  id: number;
  title: string;
  price: number;
  image_url: string | null;
  location: string | null;
};

export default function RelatedListings({
  category,
  currentId,
}: {
  category: string;
  currentId: string | number;
}) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("listings")
        .select("id, title, price, image_url, location")
        .eq("category", category)
        .neq("id", currentId)
        .order("created_at", { ascending: false })
        .limit(6);
      setItems((data as Item[]) || []);
    }
    load();
  }, [category, currentId]);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">More in {category}</h2>
      <div className="space-y-3">
        {items.map((l) => (
          <Link
            key={l.id}
            href={`/listing/${l.id}`}
            className="flex gap-3 rounded-xl p-2 hover:bg-white/60"
          >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#d8dce1]">
              {l.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.image_url}
                  alt={l.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold">{formatPrice(l.price)}</p>
              <p className="truncate text-sm">{l.title}</p>
              {l.location && (
                <p className="truncate text-xs text-[#65676b]">{l.location}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}