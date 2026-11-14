"use client";

import { useState } from "react";

type Props = {
  value: number; // 0 to 5
  onChange?: (rating: number) => void; // pass this to make the stars clickable
  size?: number; // star size in px
};

export default function StarRating({ value, onChange, size = 20 }: Props) {
  const [hover, setHover] = useState(0);

  // Read-only: gray stars with a yellow layer on top, cut to the right width.
  // So an average of 4.6 shows 4.6 yellow stars.
  if (!onChange) {
    return (
      <span
        role="img"
        aria-label={`${value.toFixed(1)} out of 5 stars`}
        className="relative inline-block leading-none"
        style={{ fontSize: size }}
      >
        <span className="text-[#c4c9d0]">★★★★★</span>
        <span
          className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-[#f5b301]"
          style={{ width: `${(value / 5) * 100}%` }}
        >
          ★★★★★
        </span>
      </span>
    );
  }

  // Clickable: stars up to the hovered (or chosen) one turn yellow
  const shown = hover || value;

  return (
    <span className="inline-flex" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => {
            onChange(n);
            setHover(0);
          }}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          aria-pressed={value === n}
          className={`px-0.5 leading-none transition-transform hover:scale-110 active:scale-90 ${
            n <= shown ? "text-[#f5b301]" : "text-[#c4c9d0]"
          }`}
          style={{ fontSize: size }}
        >
          ★
        </button>
      ))}
    </span>
  );
}
