"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function onCopy() {
    try {
      if (!navigator.clipboard) {
        // Fallback for non-HTTPS (e.g. HTTP localhost)
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!success) throw new Error("Copy failed");
      } else {
        await navigator.clipboard.writeText(value);
      }
      setError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`px-3 py-2 rounded border text-sm transition-colors ${
        error
          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
          : copied
          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      {error ? "Failed" : copied ? "Copied!" : "Copy"}
    </button>
  );
}





