"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Toggle dark mode"
      onClick={toggle}
      className="relative inline-flex h-8 w-16 items-center rounded-full bg-[var(--surface-2)] px-1 transition"
    >
      <span className="absolute left-2 text-sm">☀️</span>
      <span className="absolute right-2 text-sm">🌙</span>
      <span
        className={`z-10 h-6 w-6 rounded-full bg-[var(--accent)] shadow transition-transform ${
          dark ? "translate-x-8" : "translate-x-0"
        }`}
      />
    </button>
  );
}