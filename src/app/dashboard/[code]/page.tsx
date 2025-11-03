"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAnalytics } from "@/lib/api";
import type { Analytics } from "@/types";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { ArrowLeft, ExternalLink, Copy, QrCode } from "lucide-react";
import Link from "next/link";
import { QRCodeModal } from "@/components/QRCodeModal";

export default function AnalyticsPage() {
  const params = useParams();
  const code = params.code as string;
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortUrl = typeof window !== "undefined" ? `${window.location.origin}/${code}` : "";

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalytics(code);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      loadAnalytics();
    }
  }, [code]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <button
            onClick={loadAnalytics}
            className="ml-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : analytics ? (
          <>
            {/* Link Info Card */}
            <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold truncate">
                      {shortUrl}
                    </h2>
                    <button
                      onClick={copyToClipboard}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Copy short URL"
                    >
                      <Copy className={`w-4 h-4 ${copied ? "text-green-500" : ""}`} />
                    </button>
                    <button
                      onClick={() => setShowQR(true)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Show QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <a
                      href={analytics.link.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-blue-500 truncate flex items-center gap-1"
                    >
                      <span className="truncate">{analytics.link.originalUrl}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Created: {formatDate(analytics.link.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Charts */}
            <AnalyticsChart analytics={analytics} />
          </>
        ) : null}
      </div>

      {showQR && shortUrl && (
        <QRCodeModal shortUrl={shortUrl} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}

