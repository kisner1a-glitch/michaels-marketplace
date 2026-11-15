"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

function HeaderBar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const listing = pathname.startsWith("/listing/");
  const browse = pathname === "/" || pathname.startsWith("/category/");
  const width = listing ? "max-w-[1600px]" : browse ? "max-w-[1800px]" : "max-w-7xl";
  return <header className={`mx-auto px-4 pt-4 ${width}`}>{children}</header>;
}

export default function HeaderShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<header className="mx-auto max-w-[1800px] px-4 pt-4">{children}</header>}>
      <HeaderBar>{children}</HeaderBar>
    </Suspense>
  );
}
