'use client';

import { useEffect, useState } from 'react';

interface RevenueData {
  planDistribution: Record<string, number>;
  totalCreditsInCirculation: number;
  monthlyRevenue: number;
  totalRevenue: number;
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, []);

  const planColors: Record<string, string> = {
    free: 'bg-gray-600',
    pro: 'bg-emerald-600',
    enterprise: 'bg-purple-600',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenue</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      ) : !data ? (
        <p className="text-gray-400">Failed to load revenue data.</p>
      ) : (
        <>
          {/* Revenue cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">${data.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-400">This Month</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">${data.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-400">Credits in Circulation</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">{data.totalCreditsInCirculation.toLocaleString()}</p>
            </div>
          </div>

          {/* Plan distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Plan Distribution</h2>
            <div className="space-y-3">
              {Object.entries(data.planDistribution).map(([plan, count]) => {
                const total = Object.values(data.planDistribution).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-300">{plan}</span>
                      <span className="text-gray-400">{count} users ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${planColors[plan] || 'bg-gray-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart placeholder */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-500">Revenue charts will be rendered here with Recharts</p>
          </div>
        </>
      )}
    </div>
  );
}
