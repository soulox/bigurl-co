"use client";

import { useState } from "react";
import { createShortLink } from "@/lib/api";
import type { ShortLink } from "@/types";

export function URLShortener() {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await createShortLink({ url, customSlug: customSlug || undefined });
      setResult(data);
      // Clear inputs on success
      setUrl("");
      setCustomSlug("");
    } catch (err: any) {
      console.error("Failed to shorten URL:", err);
      // Better error messages
      if (err?.message?.includes("409") || err?.message?.includes("already in use")) {
        setError("This custom slug is already taken. Try a different one.");
      } else if (err?.message?.includes("429")) {
        setError("Too many requests. Please slow down and try again.");
      } else if (err?.message?.includes("Failed to fetch") || err?.message?.includes("network")) {
        setError("Network error. Check your connection and try again.");
      } else {
        setError(err?.message || "Failed to shorten URL. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Enter your long URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-3 py-3 rounded border border-black/10 dark:border-white/15 bg-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="px-4 py-3 rounded bg-blue-500 text-white disabled:opacity-50"
          >
            {loading ? "Shortening..." : "Shorten"}
          </button>
        </div>
        <input
          type="text"
          placeholder="Custom slug (optional)"
          value={customSlug}
          onChange={(e) => setCustomSlug(e.target.value)}
          className="px-3 py-2 rounded border border-black/10 dark:border-white/15 bg-transparent"
        />
      </form>

      {error && (
        <div className="mt-3 p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
      {result && (
        <div className="mt-4">
          {/* @ts-expect-error - component is typed */}
          <div className="mt-2">
            {/* Inline import to avoid circular refs */}
            {require("./ShortLinkCard").ShortLinkCard({ link: result })}
          </div>
        </div>
      )}
    </div>
  );
}





