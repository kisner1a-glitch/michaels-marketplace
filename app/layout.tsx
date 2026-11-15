import HeaderShell from "@/components/HeaderShell";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#f0f2f5] text-[#1c1e21] antialiased">
        <HeaderShell>
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877f2] text-2xl font-extrabold text-white">
              M
            </span>
            <span className="text-lg font-bold">Marketplace</span>
          </Link>
        </HeaderShell>
        {children}
      </body>
    </html>
  );
}