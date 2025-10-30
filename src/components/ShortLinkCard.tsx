import type { ShortLink } from "@/types";
import { CopyButton } from "./CopyButton";

export function ShortLinkCard({ link }: { link: ShortLink }) {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 rounded border border-black/10 dark:border-white/15 flex items-center justify-between">
      <a href={link.shortUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
        {link.shortUrl}
      </a>
      <CopyButton value={link.shortUrl} />
    </div>
  );
}





