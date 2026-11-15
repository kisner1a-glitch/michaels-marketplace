"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Lightbox from "@/components/Lightbox";
import {
  supabase,
  CATEGORIES,
  formatPrice,
  inputClass,
  primaryButton,
} from "@/lib/supabase";

const MAX_IMAGES = 10;
const MAX_MB = 5;

export default function CreateItemPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError("");
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const small = incoming.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    const room = MAX_IMAGES - files.length;
    const ok = small.slice(0, room);
    if (small.length < incoming.length) setError(`Each photo must be under ${MAX_MB} MB.`);
    else if (small.length > room) setError(`You can add up to ${MAX_IMAGES} photos.`);
    setFiles((p) => [...p, ...ok]);
    setPreviews((p) => [...p, ...ok.map((f) => URL.createObjectURL(f))]);
  }

  function removeFile(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setFiles((p) => p.filter((_, n) => n !== idx));
    setPreviews((p) => p.filter((_, n) => n !== idx));
  }

  // "10,000" or "$10,000" -> 10000
  const priceNum = Number(price.replace(/[,$\s]/g, ""));
  const priceOk = price.trim() !== "" && !isNaN(priceNum) && priceNum >= 0;

  async function publish() {
    setError("");
    if (files.length === 0) return setError("Please add at least one photo.");
    if (!title.trim()) return setError("Please enter a title.");
    if (!priceOk) return setError("Please enter a valid price (0 or more).");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return setError("Please enter a valid email.");
    if (!description.trim()) return setError("Please enter a description.");

    setSaving(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
        const up = await supabase.storage.from("media").upload(path, file, {
          contentType: file.type || undefined,
        });
        if (up.error) throw new Error("Photo upload failed: " + up.error.message);
        urls.push(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
      }

      const { data, error: insErr } = await supabase
        .from("listings")
        .insert({
          title: title.trim(),
          description: description.trim(),
          price: priceNum,
          email: email.trim(),
          seller_name: sellerName.trim() || null,
          category,
          location: location.trim() || null,
          image_url: urls[0],
          image_urls: urls,
        })
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);
      router.push(`/listing/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[360px_1fr_260px]">
      <section className="space-y-3">
        <h1 className="text-2xl font-extrabold">Item for sale</h1>

        <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c4c9d0] bg-white text-lg text-[#65676b] hover:border-[#1e88e5]">
          <span>Add photos</span>
          <span className="text-sm">
            {files.length}/{MAX_IMAGES} added. You can select several at once.
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {previews.length > 0 && (
          <div>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, idx) => (
                <div key={src} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpen(idx)}
                    className="block aspect-square w-full overflow-hidden rounded-lg bg-[#d8dce1] hover:opacity-90"
                    aria-label={`View photo ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove photo ${idx + 1}`}
                    className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-sm text-white hover:bg-black"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-[#65676b]">Click a photo to see it full size.</p>
          </div>
        )}

        <input className={inputClass} placeholder="Title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} placeholder="Price (USD)" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input className={inputClass} placeholder="Location (optional)" maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className={inputClass} placeholder="Seller name (optional)" maxLength={80} value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
        <input className={inputClass} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <textarea className={inputClass + " h-32"} placeholder="Description" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={primaryButton} onClick={publish} disabled={saving}>
          {saving ? "Publishing..." : "Publish"}
        </button>
      </section>

      <section>
        <p className="mb-2 text-lg">Preview</p>
        <div className="flex aspect-[4/5] max-h-[640px] items-center justify-center overflow-hidden rounded-2xl bg-[#d8dce1]">
          {previews[0] ? (
            <button
              type="button"
              onClick={() => setOpen(0)}
              className="h-full w-full cursor-zoom-in"
              aria-label="View photo full size"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[0]} alt="Preview" className="h-full w-full object-cover" />
            </button>
          ) : (
            <span className="text-[#65676b]">Your photo appears here</span>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-extrabold">{title || "Title"}</h2>
        <p className="text-2xl font-extrabold">{priceOk ? formatPrice(priceNum) : "Price"}</p>
        <p className="mt-6 text-[#65676b]">Listed just now{location ? ` in ${location}` : ""}</p>
        <p className="mt-6 font-semibold">Seller information</p>
        <p className="break-all text-[#65676b]">{sellerName || email || "your email"}</p>
      </section>

      {open !== null && previews.length > 0 && (
        <Lightbox images={previews} startIndex={open} onClose={() => setOpen(null)} />
      )}
    </main>
  );
}
