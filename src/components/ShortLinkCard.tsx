"use client";

import { useState } from "react";
import type { ShortLink } from "@/types";
import { CopyButton } from "./CopyButton";
import { QRCodeModal } from "./QRCodeModal";
import { QrCode } from "lucide-react";

export function ShortLinkCard({ link }: { link: ShortLink }) {
  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto p-4 rounded border border-black/10 dark:border-white/15 flex items-center justify-between gap-2">
        <a href={link.shortUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline flex-1 truncate">
          {link.shortUrl}
        </a>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Show QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <CopyButton value={link.shortUrl} />
        </div>
      </div>
      
      {showQR && (
        <QRCodeModal shortUrl={link.shortUrl} onClose={() => setShowQR(false)} />
      )}
    </>
  );
}






