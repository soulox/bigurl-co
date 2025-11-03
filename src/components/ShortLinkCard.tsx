"use client";

import { useState } from "react";
import type { ShortLink } from "@/types";
import { CopyButton } from "./CopyButton";
import { QRCodeModal } from "./QRCodeModal";
import { QrCode, ExternalLink, Check } from "lucide-react";

export function ShortLinkCard({ link }: { link: ShortLink }) {
  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
              Your short link is ready!
            </h3>
            <a 
              href={link.shortUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-lg font-bold text-green-900 dark:text-green-200 hover:text-green-700 dark:hover:text-green-100 transition-colors flex items-center gap-2 group"
            >
              <span className="truncate">{link.shortUrl}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton value={link.shortUrl} />
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-all font-medium"
            title="Show QR Code"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-all font-medium"
          >
            <span>View in Dashboard</span>
          </a>
        </div>
      </div>
      
      {showQR && (
        <QRCodeModal shortUrl={link.shortUrl} onClose={() => setShowQR(false)} />
      )}
    </>
  );
}






