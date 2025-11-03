"use client";

import { useState } from "react";
import { createShortLink } from "@/lib/api";
import type { ShortLink } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";

export function URLShortener() {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expirationDays, setExpirationDays] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const expiresAt = expirationDays
        ? Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000
        : undefined;

      const data = await createShortLink({
        url,
        customSlug: customSlug || undefined,
        title: title || undefined,
        description: description || undefined,
        expiresAt,
        maxClicks: maxClicks ? parseInt(maxClicks) : undefined,
      });
      setResult(data);
      // Clear inputs on success
      setUrl("");
      setCustomSlug("");
      setTitle("");
      setDescription("");
      setExpirationDays("");
      setMaxClicks("");
      setShowAdvanced(false);
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
            className="px-4 py-3 rounded bg-blue-500 text-white disabled:opacity-50 hover:bg-blue-600"
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

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced Options
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded space-y-3">
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded border border-black/10 dark:border-white/15 bg-transparent"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded border border-black/10 dark:border-white/15 bg-transparent"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Expires in (days)
                </label>
                <input
                  type="number"
                  placeholder="Never"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 rounded border border-black/10 dark:border-white/15 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Max clicks
                </label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={maxClicks}
                  onChange={(e) => setMaxClicks(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 rounded border border-black/10 dark:border-white/15 bg-transparent"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>💡 Set expiration date or max clicks to automatically disable links</p>
            </div>
          </div>
        )}
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





