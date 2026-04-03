'use client';

import { useEffect, useState } from 'react';

interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  totalRevenue: number;
  flaggedItems: number;
  recentSignups: number;
  activeAnalyses: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setIsLoading(false));
  }, []);

  const kpis = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), color: 'bg-blue-600' },
        { label: 'Total Analyses', value: stats.totalAnalyses.toLocaleString(), color: 'bg-emerald-600' },
        { label: 'Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, color: 'bg-purple-600' },
        { label: 'Flagged Items', value: stats.flaggedItems.toLocaleString(), color: 'bg-red-600' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Overview</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      ) : !stats ? (
        <p className="text-gray-400">Failed to load stats.</p>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-sm text-gray-400">{k.label}</p>
                <p className="text-3xl font-bold mt-1">{k.value}</p>
                <div className={`w-8 h-1 rounded mt-3 ${k.color}`} />
              </div>
            ))}
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold mb-2">Recent Signups (7d)</h3>
              <p className="text-3xl font-bold text-blue-400">{stats.recentSignups}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold mb-2">Active Analyses</h3>
              <p className="text-3xl font-bold text-emerald-400">{stats.activeAnalyses}</p>
            </div>
          </div>

          {/* Chart placeholder */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-500">Charts will be rendered here with Recharts</p>
          </div>
        </>
      )}
    </div>
  );
}
