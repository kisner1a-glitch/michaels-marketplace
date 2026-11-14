import { Suspense } from "react";
import Link from "next/link";
import Browse from "@/components/Browse";
import { categoryFromSlug } from "@/lib/supabase";

async function CategoryContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categoryFromSlug(slug);

  if (!category) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-4">Category not found.</p>
        <Link href="/" className="font-semibold text-[#1e88e5]">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return <Browse category={category} />;
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-10">Loading...</p>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}