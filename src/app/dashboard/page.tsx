"use client";

import { useEffect, useState } from "react";
import { getLinks } from "@/lib/api";
import type { Link } from "@/types";
import { LinksList } from "@/components/LinksList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLinks();
      setLinks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold">Links Dashboard</h1>
          <button
            onClick={loadLinks}
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
              onClick={loadLinks}
              className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <LinksList links={links} onUpdate={loadLinks} />
        )}

        {!loading && !error && links.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Total: {links.length} link(s)
          </div>
        )}
      </div>
    </div>
  );
}

