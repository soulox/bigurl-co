"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download } from "lucide-react";

export function QRCodeModal({ 
  shortUrl, 
  onClose 
}: { 
  shortUrl: string; 
  onClose: () => void;
}) {
  const [size, setSize] = useState(256);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg") as SVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `qr-code-${shortUrl.split("/").pop()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">QR Code</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG
              id="qr-code-svg"
              value={shortUrl}
              size={size}
              level="H"
              includeMargin
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-2">
              Size: {size}px
            </label>
            <input
              type="range"
              min="128"
              max="512"
              step="64"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 text-center break-all">
            {shortUrl}
          </div>
        </div>
      </div>
    </div>
  );
}

