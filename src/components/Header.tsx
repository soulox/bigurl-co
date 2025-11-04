"use client";

import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";

interface HeaderProps {
  variant?: "public" | "auth" | "dashboard";
  showGetStarted?: boolean;
}

export function Header({ variant = "public", showGetStarted = true }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BigURL
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {variant === "public" && (
              <>
                <Link
                  href="/pricing"
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all hidden sm:block"
                >
                  Pricing
                </Link>
                <Link
                  href="/faq"
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all hidden sm:block"
                >
                  FAQ
                </Link>
                <Link
                  href="/contact"
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all hidden md:block"
                >
                  Contact
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  Sign In
                </Link>
                {showGetStarted && (
                  <Link
                    href="/auth/signin?mode=signup"
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-sm font-semibold"
                  >
                    Get Started Free
                  </Link>
                )}
              </>
            )}

            {variant === "auth" && (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

