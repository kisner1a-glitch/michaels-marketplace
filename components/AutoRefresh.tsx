"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-checks the page every 2 seconds (up to 10 times) while we wait
// for the webhook to save the order.
export default function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      router.refresh();
      if (tries >= 10) clearInterval(timer);
    }, 2000);
    return () => clearInterval(timer);
  }, [router]);

  return null;
}
