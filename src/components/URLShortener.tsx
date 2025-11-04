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
      if (err?.message?.includes("Link limit reached") || err?.message?.includes("403")) {
        setError("You've reached your link limit. Please upgrade your plan or delete some links.");
      } else if (err?.message?.includes("Unauthorized") || err?.message?.includes("401")) {
        setError("Please sign in to create short links.");
      } else if (err?.message?.includes("409") || err?.message?.includes("already in use")) {
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
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <form onSubmit={onSubmit} className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              placeholder="Paste your long URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-lg"
              required
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none text-lg whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Shortening...
                </span>
              ) : (
                "Shorten"
              )}
            </button>
          </div>

          <input
            type="text"
            placeholder="Custom slug (optional) - e.g., my-link"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            className="mt-3 w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                rows={3}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expires in (days)
                  </label>
                  <input
                    type="number"
                    placeholder="Never expires"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max clicks
                  </label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-lg">💡</span>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Set expiration date or max clicks to automatically disable links after a certain time or number of visits
                </p>
              </div>
            </div>
          )}
        </form>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                  Your short link is ready!
                </h3>
                <a 
                  href={result.shortUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-lg font-bold text-green-900 dark:text-green-200 hover:text-green-700 dark:hover:text-green-100 transition-colors flex items-center gap-2 group"
                >
                  <span className="truncate">{result.shortUrl}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





