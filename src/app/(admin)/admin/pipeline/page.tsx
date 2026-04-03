'use client';

import { useEffect, useState } from 'react';

interface PipelineData {
  active: number;
  statusBreakdown: Record<string, number>;
  recentFailures: {
    _id: string;
    status: string;
    error?: string;
    createdAt: string;
    target?: { name?: string };
  }[];
}

export default function AdminPipelinePage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPipeline = () => {
    fetch('/api/admin/pipeline')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPipeline();
    const interval = setInterval(fetchPipeline, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-600',
    scraping_candidate: 'bg-blue-600',
    scraping_target: 'bg-blue-500',
    parsing_jd: 'bg-indigo-600',
    analyzing: 'bg-purple-600',
    generating: 'bg-emerald-600',
    complete: 'bg-emerald-500',
    failed: 'bg-red-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pipeline Monitor</h1>
        <button
          onClick={fetchPipeline}
          className="px-3 py-1.5 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      ) : !data ? (
        <p className="text-gray-400">Failed to load pipeline data.</p>
      ) : (
        <>
          {/* Active count */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-sm text-gray-400">Active Analyses</p>
            <p className="text-4xl font-bold text-emerald-400 mt-1">{data.active}</p>
          </div>

          {/* Status breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Status Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status] || 'bg-gray-500'}`} />
                  <div>
                    <p className="text-xs text-gray-400">{status.replace(/_/g, ' ')}</p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent failures */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Recent Failures</h2>
            {data.recentFailures.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent failures.</p>
            ) : (
              <div className="space-y-2">
                {data.recentFailures.map((f) => (
                  <div key={f._id} className="flex items-start justify-between bg-red-950/30 border border-red-900/30 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-red-300">
                        {f.target?.name || f._id.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.error || 'Unknown error'}</p>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-4">
                      {new Date(f.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
