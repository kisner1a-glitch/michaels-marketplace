"use client";

import { useEffect, useRef, useState } from "react";

type Flake = { x: number; y: number; r: number; s: number; d: number };

export default function ChristmasTheme() {
  const [ready, setReady] = useState(false);
  const [on, setOn] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("xmas") === "off") setOn(false);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("xmas", ready && on);
    return () => document.documentElement.classList.remove("xmas");
  }, [ready, on]);

  useEffect(() => {
    if (!ready || !on) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let flakes: Flake[] = [];

    const make = (anywhere: boolean): Flake => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -10,
      r: 1 + Math.random() * 2.6,
      s: 0.5 + Math.random() * 1.1,
      d: Math.random() * Math.PI * 2,
    });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.shadowColor = "rgba(80,120,170,0.6)";
      ctx.shadowBlur = 3;
      for (const f of flakes) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.d += 0.015;
        f.y += f.s * (0.7 + f.r * 0.3);
        f.x += Math.sin(f.d) * 0.6;
        if (f.x > w + 6) f.x = -6;
        else if (f.x < -6) f.x = w + 6;
        if (f.y > h + 6) flakes[i] = make(false);
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(170, Math.max(50, Math.floor(w / 9)));
      flakes = Array.from({ length: count }, () => make(true));
      if (reduce) draw();
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduce) raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [ready, on]);

  function toggle() {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem("xmas", next ? "on" : "off");
    } catch {}
  }

  return (
    <>
      {ready && on && (
        <>
          <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-50" />
          <div aria-hidden className="xmas-lights">
            {Array.from({ length: 100 }, (_, i) => (
              <span
                key={i}
                className={`bulb bulb-${i % 4}`}
                style={{ animationDelay: `${(i % 4) * 0.4}s` }}
              />
            ))}
          </div>
        </>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label={on ? "Turn off Christmas theme" : "Turn on Christmas theme"}
        title={on ? "Turn off Christmas theme" : "Turn on Christmas theme"}
        className={`fixed bottom-4 right-4 z-[70] flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-lg transition hover:scale-105 active:scale-95 ${
          on ? "" : "opacity-60"
        }`}
      >
        &#127876;
      </button>
    </>
  );
}
