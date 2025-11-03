"use client";

import type { Analytics } from "@/types";

export function AnalyticsChart({ analytics }: { analytics: Analytics }) {
  const { link, stats } = analytics;

  const maxCount = Math.max(
    ...stats.countries.map((c) => c.count),
    ...stats.devices.map((d) => d.count),
    ...stats.browsers.map((b) => b.count)
  );

  const StatBar = ({ label, count }: { label: string; count: number }) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-gray-600 dark:text-gray-400">{count}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const Section = ({
    title,
    data,
  }: {
    title: string;
    data: { name: string; count: number }[];
  }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No data yet</p>
      ) : (
        <div>
          {data.slice(0, 10).map((item) => (
            <StatBar key={item.name} label={item.name} count={item.count} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Clicks
          </div>
          <div className="text-3xl font-bold mt-2">{link.totalClicks}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Countries
          </div>
          <div className="text-3xl font-bold mt-2">{stats.countries.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Devices
          </div>
          <div className="text-3xl font-bold mt-2">{stats.devices.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Browsers
          </div>
          <div className="text-3xl font-bold mt-2">{stats.browsers.length}</div>
        </div>
      </div>

      {/* Clicks by Day Chart */}
      {stats.clicksByDay.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Clicks Over Time</h3>
          <div className="flex items-end gap-2 h-48">
            {stats.clicksByDay.slice(-30).map((day) => {
              const maxDayCount = Math.max(...stats.clicksByDay.map((d) => d.count));
              const height = maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.count} clicks`}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Top Countries" data={stats.countries} />
        <Section title="Top Referrers" data={stats.referrers} />
        <Section title="Devices" data={stats.devices} />
        <Section title="Browsers" data={stats.browsers} />
        <Section title="Operating Systems" data={stats.osTypes} />
      </div>
    </div>
  );
}

