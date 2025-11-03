import { URLShortener } from "@/components/URLShortener";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">BigURL</h1>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create short, memorable links with powerful analytics and QR codes
        </p>
        <URLShortener />
      </main>
    </div>
  );
}
