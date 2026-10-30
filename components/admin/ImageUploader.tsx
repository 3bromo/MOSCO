"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImageUp, Loader2, Star, Trash2 } from "lucide-react";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

export interface EditableImage {
  id?: string;
  url: string;
  alt: string;
  alt_ar?: string;
  position: number;
  color?: string | null;
}

/**
 * Multi-image manager: upload from device/gallery, preview, reorder, set the
 * primary shot, edit alt text, and remove.
 *
 * Uploads are re-encoded to WebP and bounded in size server-side, but the
 * photograph itself is never retouched — colour, cut and detail stay exactly as
 * shot, which is a hard brand rule.
 */
export default function ImageUploader({
  images,
  onChange,
  folder = "products",
  max = 12,
}: {
  images: EditableImage[];
  onChange: (next: EditableImage[]) => void;
  folder?: "products" | "banners" | "brand";
  max?: number;
}) {
  const toast = useUI((s) => s.toast);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (files: FileList | File[] | null) => {
    if (!files) return;
    const list = Array.from(files).slice(0, max - images.length);
    if (list.length === 0) {
      toast(`Maximum ${max} images.`, "info");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("folder", folder);
      for (const f of list) fd.append("file", f);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast(
          data.error === "too_large"
            ? "Each image must be under 8 MB."
            : data.error === "unsupported_type"
              ? "Use JPG, PNG, WebP or AVIF."
              : "Upload failed.",
          "error",
        );
        return;
      }

      const added: EditableImage[] = data.files.map(
        (f: { url: string }, i: number): EditableImage => ({
          url: f.url,
          alt: "",
          position: images.length + i,
        }),
      );
      onChange([...images, ...added].map((im, i) => ({ ...im, position: i })));
      toast(`${added.length} image${added.length === 1 ? "" : "s"} uploaded.`, "success");
    } catch {
      toast("Upload failed.", "error");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = images.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next.map((im, i) => ({ ...im, position: i })));
  };

  const remove = (index: number) =>
    onChange(images.filter((_, i) => i !== index).map((im, i) => ({ ...im, position: i })));

  const setAlt = (index: number, alt: string) =>
    onChange(images.map((im, i) => (i === index ? { ...im, alt } : im)));

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-lg border border-dashed p-5 transition-colors",
          dragOver ? "border-ice-600 bg-ice-50" : "border-silver-300 bg-white",
        )}
      >
        {images.length > 0 && (
          <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((im, i) => (
              <li
                key={`${im.url}-${i}`}
                className="group overflow-hidden rounded-md border border-silver-200 bg-white"
              >
                <div className="relative aspect-3/4 bg-ice-100">
                  <Image
                    src={im.url}
                    alt={im.alt || "Product image"}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-ice-900/90 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white backdrop-blur">
                      <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
                      Main
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/55 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <div className="flex gap-1">
                      <IconBtn onClick={() => move(i, i - 1)} disabled={i === 0} label="Move left">
                        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                      </IconBtn>
                      <IconBtn
                        onClick={() => move(i, i + 1)}
                        disabled={i === images.length - 1}
                        label="Move right"
                      >
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                      </IconBtn>
                    </div>
                    <IconBtn onClick={() => remove(i)} label="Remove image" danger>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    </IconBtn>
                  </div>
                </div>
                <input
                  value={im.alt}
                  onChange={(e) => setAlt(i, e.target.value)}
                  placeholder="Alt text"
                  aria-label={`Alt text for image ${i + 1}`}
                  className="w-full border-t border-silver-200 px-2.5 py-2 text-[11.5px] outline-none placeholder:text-ice-400 focus:bg-ice-50"
                />
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy || images.length >= max}
            className="btn btn-ghost !py-2.5 !text-[13px]"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <ImageUp className="h-4 w-4" strokeWidth={1.6} />
            )}
            {images.length ? "Add more images" : "Upload images"}
          </button>
          <p className="text-[12px] text-ice-500">
            Drag and drop, or pick from your device. JPG / PNG / WebP, up to 8 MB each.{" "}
            {images.length}/{max} used. First image is the main shot.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(e) => upload(e.target.files)}
        />
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-full backdrop-blur transition-colors disabled:opacity-30",
        danger
          ? "bg-white/90 text-red-600 hover:bg-red-600 hover:text-white"
          : "bg-white/90 text-ice-900 hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
