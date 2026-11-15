import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Buy and sell locally",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#e9ecef] text-[#1c1e21] antialiased">
        <header className="mx-auto max-w-7xl px-4 pt-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1e88e5] text-2xl font-extrabold text-white">
              F
            </span>
            <span className="text-lg font-bold">Marketplace</span>
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}