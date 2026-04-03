'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AnalysisItem {
  _id: string;
  status: string;
  target?: { name?: string; company?: string };
  scores?: { overallScore?: number };
  createdAt: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analyze')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAnalyses(Array.isArray(data) ? data : []))
      .catch(() => setAnalyses([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(160, 84%, 39%)' }} />
        </div>
      ) : analyses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No analyses yet.</p>
          <Link
            href="/analyze"
            className="inline-block px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
          >
            Start Your First Analysis
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <Link
              key={a._id}
              href={`/results/${a._id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {a.target?.company
                      ? `${a.target.name || 'Recruiter'} at ${a.target.company}`
                      : a.target?.name || 'Analysis'}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {a.scores?.overallScore != null && (
                    <span className="text-xl font-bold" style={{ color: 'hsl(160, 84%, 39%)' }}>
                      {a.scores.overallScore}%
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
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
  );
}
