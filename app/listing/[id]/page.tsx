import { Suspense } from "react";
import ListingView from "@/components/ListingView";

async function ListingContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingView id={id} />;
}

export default function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-10">Loading...</p>}>
      <ListingContent params={params} />
    </Suspense>
  );
}