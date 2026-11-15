"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import NavControls from "@/components/NavControls";

function Bar({ children, width }: { children: React.ReactNode; width: string }) {
  return (
    <header className="border-b border-[#c4c9d0]">
      <div className={`mx-auto flex items-center justify-between px-4 py-2 ${width}`}>
        {children}
        <NavControls />
      </div>
    </header>
  );
}

function HeaderBar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const listing = pathname.startsWith("/listing/");
  const browse = pathname === "/" || pathname.startsWith("/category/");
  const width = listing ? "max-w-[1600px]" : browse ? "max-w-[1800px]" : "max-w-7xl";
  return <Bar width={width}>{children}</Bar>;
}

export default function HeaderShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Bar width="max-w-[1800px]">{children}</Bar>}>
      <HeaderBar>{children}</HeaderBar>
    </Suspense>
  );
}
