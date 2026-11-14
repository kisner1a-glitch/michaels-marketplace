"use client";

import { useEffect, useState } from "react";

export default function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(startIndex);
  const many = images.length > 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setI((n) => (n + 1) % images.length);
    }
    window.addEventListener("keydown", onKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl text-white hover:bg-white/30"
      >
        ×
      </button>

      {many && (
        <button
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            setI((n) => (n - 1 + images.length) % images.length);
          }}
          className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-3xl text-white hover:bg-white/30"
        >
          ‹
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[i]}
        alt={`Photo ${i + 1} of ${images.length}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
      />

      {many && (
        <button
          aria-label="Next photo"
          onClick={(e) => {
            e.stopPropagation();
            setI((n) => (n + 1) % images.length);
          }}
          className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-3xl text-white hover:bg-white/30"
        >
          ›
        </button>
      )}

      {many && (
        <p className="absolute bottom-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {i + 1} / {images.length}
        </p>
      )}
    </div>
  );
}