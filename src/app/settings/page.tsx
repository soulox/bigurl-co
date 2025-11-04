"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Package, LogOut, ChevronRight } from "lucide-react";

interface UserStats {
  package: string;
  link_limit: number;
  link_count: number;
  links_remaining: number;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  package: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/auth/signin");
      return;
    }

    setUser(JSON.parse(userData));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/user/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load stats");
      }

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to load user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (packageType: string) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/user/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ package: packageType }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update package");
        return;
      }

      // Update local user data
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      userData.package = packageType;
      localStorage.setItem("user", JSON.stringify(userData));

      // Reload data
      loadUserData();
      alert("Plan updated successfully!");
    } catch (error) {
      alert("Failed to update plan");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BigURL
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Usage Card */}
          {stats && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Current Plan & Usage
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Links Used</span>
                    <span className="text-sm font-bold">
                      {stats.link_count} / {stats.link_limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                      style={{ width: `${(stats.link_count / stats.link_limit) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <div className="font-semibold capitalize">{stats.package} Plan</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.links_remaining} links remaining
                    </div>
                  </div>
                  <span className="text-2xl font-bold">
                    {stats.package === "free" && "$0"}
                    {stats.package === "basic" && "$9"}
                    {stats.package === "pro" && "$29"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Options */}
          {stats && stats.package !== "pro" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Upgrade Your Plan</h3>
              
              <div className="space-y-3">
                {stats.package === "free" && (
                  <>
                    <button
                      onClick={() => handleUpgrade("basic")}
                      className="w-full p-4 border-2 border-blue-500 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-between group"
                    >
                      <div className="text-left">
                        <div className="font-semibold">Basic - $9/month</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">20 links + advanced features</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleUpgrade("pro")}
                      className="w-full p-4 border-2 border-purple-500 dark:border-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-between group"
                    >
                      <div className="text-left">
                        <div className="font-semibold">Pro - $29/month</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">100 links + API access</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </>
                )}
                
                {stats.package === "basic" && (
                  <button
                    onClick={() => handleUpgrade("pro")}
                    className="w-full p-4 border-2 border-purple-500 dark:border-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-between group"
                  >
                    <div className="text-left">
                      <div className="font-semibold">Pro - $29/month</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">100 links + API access</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>

              <div className="mt-4 text-center">
                <Link href="/pricing" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  View all plans
                </Link>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}

