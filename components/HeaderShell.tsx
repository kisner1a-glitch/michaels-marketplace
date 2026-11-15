"use client";

import { usePathname } from "next/navigation";

export default function HeaderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wide = pathname.startsWith("/listing/");
  return (
    <header className={`mx-auto px-4 pt-4 ${wide ? "max-w-[1600px]" : "max-w-7xl"}`}>
      {children}
    </header>
  );
}
