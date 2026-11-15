"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

function WideOnListing({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wide = pathname.startsWith("/listing/");
  return (
    <header className={`mx-auto px-4 pt-4 ${wide ? "max-w-[1600px]" : "max-w-7xl"}`}>
      {children}
    </header>
  );
}

export default function HeaderShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<header className="mx-auto max-w-7xl px-4 pt-4">{children}</header>}>
      <WideOnListing>{children}</WideOnListing>
    </Suspense>
  );
}
