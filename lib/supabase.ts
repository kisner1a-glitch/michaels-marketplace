import { createClient } from "@supabase/supabase-js";

// URL and key come from .env.local (and from Vercel when deployed)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const CATEGORIES = [
  "Vehicles",
  "Property Rentals",
  "Apparel",
  "Classifieds",
  "Electronics",
  "Entertainment",
  "Family",
  "Free Stuff",
  "Garden & Outdoor",
  "Hobbies",
  "Home Goods",
  "Home Improvement",
  "Home Sales",
  "Musical Instruments",
  "Office Supplies",
  "Pet Supplies",
  "Sporting Goods",
  "Toys & Games",
  "Buy and sell groups",
];

export type Listing = {
  id: number;
  title: string;
  description: string;
  price: number;
  email: string;
  category: string;
  location: string | null;
  image_url: string | null;image_urls: string[] | null;
  created_at: string;
};

// "Garden & Outdoor" -> "garden-and-outdoor"
export function slugify(name: string) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function categoryFromSlug(slug: string) {
  return CATEGORIES.find((c) => slugify(c) === slug) ?? null;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

// "Listed 1 hour ago"
export function listedAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return `on ${new Date(iso).toLocaleDateString()}`;
}

export const inputClass =
  "w-full rounded-xl border border-[#c4c9d0] bg-white px-3 py-2.5 text-[15px] text-[#1c1e21] placeholder:text-[#8a8d91] focus:border-[#1e88e5] focus:outline-none focus:ring-2 focus:ring-[#1e88e5]/30";
export const primaryButton =
  "rounded-xl bg-[#1e88e5] px-5 py-2.5 text-[15px] font-bold text-white hover:bg-[#1976d2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e88e5] disabled:cursor-not-allowed disabled:opacity-50";
