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
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <header className="mx-auto max-w-7xl px-4 pt-4">
          <Link href="/" className="inline-flex flex-col items-start">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-2xl font-extrabold text-white">
              F
            </span>
            <span className="mt-1 text-lg font-bold">Marketplace</span>
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}