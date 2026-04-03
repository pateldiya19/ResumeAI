'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowRight, FileText, BarChart3 } from 'lucide-react';
import { useCredits } from '@/hooks/use-credits';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { StatusBadge } from '@/components/ui/status-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

interface RecentAnalysis {
  _id: string;
  status: string;
  target?: { name?: string; company?: string };
  scores?: { overallScore?: number };
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useUser();
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
    { label: 'Analyses', value: `${usage.analysesUsed}/${usage.analysesLimit === -1 ? '∞' : usage.analysesLimit}`, icon: BarChart3 },
    { label: 'Emails Sent', value: `${usage.sendsUsed}/${usage.sendsLimit === -1 ? '∞' : usage.sendsLimit}`, icon: FileText },
    { label: 'Credits', value: credits, icon: FileText },
    { label: 'Plan', value: plan.toUpperCase(), icon: FileText, isPlan: true },
  ];

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'there'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Here&apos;s an overview of your account.</p>
        </div>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StaggerItem key={s.label}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                  {creditsLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : s.isPlan ? (
                    <div className="mt-1"><PlanBadge plan={plan} /></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* CTA */}
        <Link href="/analyze">
          <Card className="group hover:shadow-lg hover:ring-brand-200 transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                  <PlusCircle className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Start New Analysis</p>
                  <p className="text-sm text-gray-500">Upload your resume and target a recruiter</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>

        {/* Recent Analyses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Analyses</h2>
            {recent.length > 0 && (
              <Link href="/history" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all →
              </Link>
            )}
          </div>

          {loadingRecent ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <Card>
              <EmptyState
                icon={<BarChart3 className="w-7 h-7" />}
                title="No analyses yet"
                description="Start your first analysis to see results here."
                actionLabel="Start Analysis"
                actionHref="/analyze"
              />
            </Card>
          ) : (
            <StaggerContainer className="space-y-3">
              {recent.map((a) => (
                <StaggerItem key={a._id}>
                  <Link href={`/results/${a._id}`}>
                    <Card className="hover:shadow-md hover:ring-brand-100 transition-all cursor-pointer group">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {a.scores?.overallScore != null ? (
                            <ScoreGauge score={a.scores.overallScore} size="sm" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                              <span className="text-xs text-gray-400">--</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {a.target?.name || a.target?.company || 'Analysis'}
                            </p>
                            {a.target?.company && a.target?.name && (
                              <p className="text-xs text-gray-500">{a.target.company}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.createdAt)}</p>
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
      </div>
    </PageTransition>
  );
}
