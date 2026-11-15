"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Mode = "light" | "dark" | "system";

function applyTheme(mode: Mode) {
  const dark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  return dark;
}

const svgProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function NavControls() {
  const [mode, setMode] = useState<Mode>("system");
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      setMode(saved === "light" || saved === "dark" ? saved : "system");
    } catch {}
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDark(applyTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function choose(next: Mode) {
    setMode(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setDark(applyTheme(next));
  }

  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5";

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        onClick={() => choose(dark ? "light" : "dark")}
        aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
        className={iconBtn}
      >
        {dark ? (
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg {...svgProps}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Settings"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={iconBtn}
        >
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-[#ced0d4] bg-white p-2 shadow-lg"
          >
            <p className="px-2 py-1 text-xs font-semibold uppercase text-[#65676b]">Theme</p>
            {(["light", "dark", "system"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="menuitemradio"
                aria-checked={mode === m}
                onClick={() => choose(m)}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[15px] hover:bg-black/5 ${
                  mode === m ? "font-bold text-[#1877f2]" : ""
                }`}
              >
                <span className="capitalize">{m}</span>
                {mode === m && <span>&#10003;</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/login"
        className="rounded-xl px-3 py-2 text-[15px] font-semibold hover:bg-black/5"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="rounded-xl bg-[#1877f2] px-3 py-2 text-[15px] font-bold text-white hover:bg-[#166fe5]"
      >
        Sign up
      </Link>
    </div>
  );
}
