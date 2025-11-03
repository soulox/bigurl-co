import type { ShortLink, Link, Analytics, CreateLinkInput, UpdateLinkInput } from "@/types";

export async function createShortLink(input: CreateLinkInput): Promise<ShortLink> {
  const res = await fetch("/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || "Failed to shorten URL");
  }
  return res.json();
}

export async function getLinks(): Promise<Link[]> {
  const res = await fetch("/api/links");
  if (!res.ok) throw new Error("Failed to fetch links");
  const data = await res.json();
  return data.links;
}

export async function getLink(id: string): Promise<Link> {
  const res = await fetch(`/api/links/${id}`);
  if (!res.ok) throw new Error("Failed to fetch link");
  const data = await res.json();
  return data.link;
}

export async function updateLink(id: string, updates: UpdateLinkInput): Promise<void> {
  const res = await fetch(`/api/links/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || "Failed to update link");
  }
}

export async function deleteLink(id: string): Promise<void> {
  const res = await fetch(`/api/links/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete link");
}

export async function bulkDeleteLinks(ids: string[]): Promise<void> {
  const res = await fetch("/api/links/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to bulk delete links");
}

export async function bulkUpdateLinks(ids: string[], updates: { is_active?: boolean }): Promise<void> {
  const res = await fetch("/api/links/bulk-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, updates }),
  });
  if (!res.ok) throw new Error("Failed to bulk update links");
}

export async function getAnalytics(code: string): Promise<Analytics> {
  const res = await fetch(`/api/analytics/${code}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function getQRCode(code: string, size = 256): Promise<{ shortUrl: string; qrCodeUrl: string }> {
  const res = await fetch(`/api/qr/${code}?size=${size}`);
  if (!res.ok) throw new Error("Failed to fetch QR code");
  return res.json();
}





