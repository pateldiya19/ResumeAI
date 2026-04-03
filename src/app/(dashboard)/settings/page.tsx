'use client';

import { useUser, UserProfile } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useCredits } from '@/hooks/use-credits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user } = useUser();
  const { credits, plan, usage, isLoading } = useCredits();

  const usageBars = [
    {
      label: 'Analyses This Month',
      used: usage.analysesUsed,
      limit: usage.analysesLimit,
    },
    {
      label: 'Emails Sent This Month',
      used: usage.sendsUsed,
      limit: usage.sendsLimit,
    },
  ];

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-xl font-bold text-brand-600">
                {(user?.fullName || user?.primaryEmailAddress?.emailAddress || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.fullName || 'User'}</p>
                <p className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan & Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Plan & Usage
              <PlanBadge plan={plan} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Credits Remaining</span>
                  <span className="text-sm font-semibold text-gray-900">{credits}</span>
                </div>

                {usageBars.map((bar) => {
                  const isUnlimited = bar.limit === -1;
                  const pct = isUnlimited ? 0 : Math.min((bar.used / bar.limit) * 100, 100);
                  return (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-500">{bar.label}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {bar.used}/{isUnlimited ? '∞' : bar.limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-2 rounded-full bg-brand-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  );
                })}

                {plan === 'free' && (
                  <div className="rounded-xl bg-brand-50/50 ring-1 ring-brand-200/30 p-4 text-center">
                    <p className="text-sm font-medium text-brand-800 mb-2">Upgrade to unlock more features</p>
                    <p className="text-xs text-brand-600/70 mb-3">
                      Get unlimited analyses, one-click email send, and full recruiter personas.
                    </p>
                    <Button size="sm">Upgrade to Pro</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle>Account Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Manage your password, email, and connected accounts.
            </p>
            <UserProfile
              appearance={{
                variables: {
                  colorPrimary: '#6C3AED',
                  borderRadius: '12px',
                },
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 p-0',
                },
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
