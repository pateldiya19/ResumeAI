'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCredits } from '@/hooks/use-credits';

interface RecentAnalysis {
  _id: string;
  status: string;
  target?: { name?: string; company?: string };
  scores?: { overallScore?: number };
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { credits, plan, usage, isLoading: creditsLoading } = useCredits();
  const [recent, setRecent] = useState<RecentAnalysis[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    fetch('/api/analyze')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRecent(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setRecent([]))
      .finally(() => setLoadingRecent(false));
  }, []);

  const stats = [
    { label: 'Analyses Used', value: `${usage.analysesUsed} / ${usage.analysesLimit}` },
    { label: 'Emails Sent', value: `${usage.sendsUsed} / ${usage.sendsLimit}` },
    { label: 'Credits', value: credits },
    { label: 'Plan', value: plan.toUpperCase() },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || 'there'}
        </h1>
        <p className="text-gray-500 mt-1">Here is an overview of your account.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {creditsLoading ? '...' : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/analyze"
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-lg shadow transition hover:shadow-lg"
        style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Start New Analysis
      </Link>

      {/* Recent */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h2>
        {loadingRecent ? (
          <p className="text-gray-500">Loading...</p>
        ) : recent.length === 0 ? (
          <p className="text-gray-500">No analyses yet. Start your first one above!</p>
        ) : (
          <div className="space-y-3">
            {recent.map((a) => (
              <Link
                key={a._id}
                href={`/results/${a._id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {a.target?.name || a.target?.company || 'Analysis'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.scores?.overallScore != null && (
                      <span className="text-lg font-bold" style={{ color: 'hsl(160, 84%, 39%)' }}>
                        {a.scores.overallScore}%
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        a.status === 'complete'
                          ? 'bg-emerald-100 text-emerald-700'
                          : a.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
