'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

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

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BarChart3 className="w-7 h-7" />}
              title="No analyses yet"
              description="Start your first analysis to see results here."
              actionLabel="Start Your First Analysis"
              actionHref="/analyze"
            />
          </Card>
        ) : (
          <StaggerContainer className="space-y-3">
            {analyses.map((a) => (
              <StaggerItem key={a._id}>
                <Link href={`/results/${a._id}`}>
                  <Card className="hover:shadow-md hover:ring-brand-100 transition-all cursor-pointer group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {a.scores?.overallScore != null ? (
                          <ScoreGauge score={a.scores.overallScore} size="sm" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {a.target?.company
                              ? `${a.target.name || 'Recruiter'} at ${a.target.company}`
                              : a.target?.name || 'Analysis'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(a.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })} · {timeAgo(a.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={a.status} />
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
