import type { ShortLink } from "@/types";

export async function createShortLink(input: { url: string; customSlug?: string }): Promise<ShortLink> {
  const res = await fetch("/api/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || "Failed to shorten URL");
  }
  return res.json();
}





