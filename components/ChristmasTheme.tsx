"use client";

import { useEffect, useRef, useState } from "react";

type Flake = { x: number; y: number; r: number; s: number; d: number };
type AudioState = { ctx: AudioContext; master: GainNode; timer: number | null };

/* "We Wish You a Merry Christmas" (traditional), instrumental, music-box tone */
const BEAT = 0.52; // seconds per beat
const MELODY: [string, number][] = [
  ["D4", 1],
  ["G4", 1], ["G4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F#4", 0.5],
  ["E4", 1], ["E4", 1], ["E4", 1],
  ["A4", 1], ["A4", 0.5], ["B4", 0.5], ["A4", 0.5], ["G4", 0.5],
  ["F#4", 1], ["D4", 1], ["D4", 1],
  ["B4", 1], ["B4", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 0.5],
  ["G4", 1], ["E4", 1], ["D4", 0.5], ["D4", 0.5],
  ["E4", 1], ["A4", 1], ["F#4", 1],
  ["G4", 3],
  ["R", 2],
];

const SEMI: Record<string, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};
const PARTIALS: [number, number][] = [[1, 1], [2, 0.28], [3, 0.1]];

function freq(name: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  if (!m) return 0;
  const midi = 12 * (Number(m[2]) + 1) + SEMI[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function ping(ctx: AudioContext, out: AudioNode, f: number, t: number, dur: number) {
  const end = t + Math.max(0.6, dur * 2);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  g.connect(out);
  for (const [mult, amp] of PARTIALS) {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = "sine";
    o.frequency.value = f * mult;
    og.gain.value = amp;
    o.connect(og);
    og.connect(g);
    o.start(t);
    o.stop(end + 0.05);
  }
}

function startAudio(): AudioState | null {
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const AC = w.AudioContext || w.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.8);
  master.connect(ctx.destination);

  // dry signal plus a soft echo
  const bus = ctx.createGain();
  bus.connect(master);
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.3;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  bus.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(master);

  const state: AudioState = { ctx, master, timer: null };
  const run = (at: number) => {
    let t = at;
    for (const [note, beats] of MELODY) {
      const d = beats * BEAT;
      if (note !== "R") ping(ctx, bus, freq(note), t, d);
      t += d;
    }
    const wait = Math.max(0, (t - ctx.currentTime - 4) * 1000);
    state.timer = window.setTimeout(() => run(t), wait);
  };
  void ctx.resume();
  run(ctx.currentTime + 0.15);
  return state;
}

function stopAudio(a: AudioState) {
  if (a.timer !== null) window.clearTimeout(a.timer);
  const t = a.ctx.currentTime;
  a.master.gain.cancelScheduledValues(t);
  a.master.gain.setValueAtTime(a.master.gain.value, t);
  a.master.gain.linearRampToValueAtTime(0, t + 0.4);
  window.setTimeout(() => {
    void a.ctx.close();
  }, 600);
}

export default function ChristmasTheme() {
  const [ready, setReady] = useState(false);
  const [on, setOn] = useState(true);
  const [wantMusic, setWantMusic] = useState(false);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioState | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("xmas") === "off") setOn(false);
      if (localStorage.getItem("xmasMusic") === "on") setWantMusic(true);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("xmas", ready && on);
    return () => document.documentElement.classList.remove("xmas");
  }, [ready, on]);

  // Snow
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

  // Music: stop when the theme is turned off or the page unmounts
  useEffect(() => {
    if (ready && !on && audioRef.current) {
      stopAudio(audioRef.current);
      audioRef.current = null;
      setPlaying(false);
    }
  }, [ready, on]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        stopAudio(audioRef.current);
        audioRef.current = null;
      }
    };
  }, []);

  // If music was left on, start it at the first click or key press (browsers require a gesture)
  useEffect(() => {
    if (!ready || !on || !wantMusic || playing) return;
    const go = (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest?.("[data-music-btn]")) return;
      if (audioRef.current) return;
      const a = startAudio();
      if (a) {
        audioRef.current = a;
        setPlaying(true);
      }
    };
    window.addEventListener("pointerdown", go, { once: true });
    window.addEventListener("keydown", go, { once: true });
    return () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
  }, [ready, on, wantMusic, playing]);

  function toggleMusic() {
    if (audioRef.current) {
      stopAudio(audioRef.current);
      audioRef.current = null;
      setPlaying(false);
      setWantMusic(false);
      try {
        localStorage.setItem("xmasMusic", "off");
      } catch {}
    } else {
      const a = startAudio();
      if (a) {
        audioRef.current = a;
        setPlaying(true);
      }
      setWantMusic(true);
      try {
        localStorage.setItem("xmasMusic", "on");
      } catch {}
    }
  }

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
          <button
            type="button"
            data-music-btn
            onClick={toggleMusic}
            aria-label={playing ? "Mute Christmas music" : "Play Christmas music"}
            title={playing ? "Mute Christmas music" : "Play Christmas music"}
            className="fixed bottom-4 right-[4.5rem] z-[70] flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-lg transition hover:scale-105 active:scale-95"
          >
            {playing ? <>&#128266;</> : <>&#128263;</>}
          </button>
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
