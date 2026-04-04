'use client';

import { useState, useEffect } from 'react';
import { useUser, UserProfile } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, Check, Zap, Crown, Rocket, AlertCircle } from 'lucide-react';
import { useCredits } from '@/hooks/use-credits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

const PLAN_CARDS = [
  {
    key: 'free' as const,
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['3 analyses/month', 'ATS scoring', 'Resume download', 'Email copy'],
    icon: Zap,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: '$19',
    period: '/month',
    features: ['Unlimited analyses', '10 email sends/month', 'Full recruiter persona', 'Auto JD generation', 'Project portfolio'],
    icon: Crown,
    popular: true,
  },
  {
    key: 'enterprise' as const,
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    features: ['Everything in Pro', 'Unlimited email sends', 'Batch mode', 'Priority scraping', 'Team seats'],
    icon: Rocket,
  },
];

export default function SettingsPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const { credits, plan, usage, isLoading, refetch } = useCredits();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Verify Stripe checkout session on return from payment
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const cancelled = searchParams.get('cancelled');

    if (cancelled) {
      toast.error('Payment was cancelled');
      // Clean URL
      window.history.replaceState({}, '', '/settings');
      return;
    }

    if (sessionId) {
      setVerifying(true);
      fetch('/api/stripe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            toast.success(data.message || 'Plan upgraded successfully!');
            refetch(); // Refresh credits/plan data
          } else {
            toast.error(data.error || 'Failed to verify payment');
            setUpgradeError(data.error);
          }
        })
        .catch(() => {
          toast.error('Failed to verify payment');
        })
        .finally(() => {
          setVerifying(false);
          window.history.replaceState({}, '', '/settings');
        });
    }
  }, [searchParams, refetch]);

  const handleUpgrade = async (targetPlan: 'pro' | 'enterprise') => {
    setUpgrading(targetPlan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        const errMsg = data.error || 'Failed to start checkout';
        toast.error(errMsg);
        setUpgradeError(errMsg);
      }
    } catch {
      toast.error('Failed to connect to payment service');
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error('No active subscription');
    } catch {
      toast.error('Failed to open billing portal');
    }
  };

  const usageBars = [
    { label: 'Analyses This Month', used: usage.analysesUsed, limit: usage.analysesLimit },
    { label: 'Emails Sent This Month', used: usage.sendsUsed, limit: usage.sendsLimit },
  ];

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* Profile */}
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xl font-bold text-white overflow-hidden">
                {user?.imageUrl ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" /> : (user?.fullName || '?')[0].toUpperCase()}
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
              <div className="flex items-center gap-2">
                <PlanBadge plan={plan} />
                {plan !== 'free' && (
                  <Button variant="outline" size="sm" onClick={handleManageBilling} className="text-xs">
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-4"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Credits Remaining</span>
                  <span className="text-sm font-semibold text-gray-900">{credits}</span>
                </div>
                {usageBars.map((bar) => {
                  const isUnlimited = bar.limit === -1;
                  const pct = isUnlimited ? 0 : Math.min((bar.used / Math.max(bar.limit, 1)) * 100, 100);
                  return (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-500">{bar.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{bar.used}/{isUnlimited ? '\u221e' : bar.limit}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <motion.div className="h-2 rounded-full bg-brand-600" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div>
          {/* Verifying payment */}
          {verifying && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 ring-1 ring-brand-200/50 mb-4">
              <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
              <span className="text-sm font-medium text-brand-700">Verifying your payment...</span>
            </div>
          )}

          {/* Upgrade error */}
          {upgradeError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 ring-1 ring-red-200/50 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Upgrade Error</p>
                <p className="text-xs text-red-600 mt-0.5">{upgradeError}</p>
              </div>
            </div>
          )}

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLAN_CARDS.map((p) => {
              const Icon = p.icon;
              const isCurrent = plan === p.key;
              return (
                <Card key={p.key} className={cn('relative overflow-hidden transition-all hover:shadow-lg', p.popular && 'ring-2 ring-brand-500')}>
                  {p.popular && (
                    <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', p.popular ? 'bg-brand-100' : 'bg-gray-100')}>
                        <Icon className={cn('w-4 h-4', p.popular ? 'text-brand-600' : 'text-gray-500')} />
                      </div>
                      <span className="font-semibold text-gray-900">{p.name}</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">{p.price}</span>
                      <span className="text-sm text-gray-500">{p.period}</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {p.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                    {isCurrent ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>Current Plan</Button>
                    ) : p.key === 'free' ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>Free Forever</Button>
                    ) : (
                      <Button
                        size="sm"
                        className={cn('w-full', p.popular ? 'bg-brand-600 hover:bg-brand-500 text-white' : '')}
                        onClick={() => handleUpgrade(p.key)}
                        disabled={!!upgrading}
                      >
                        {upgrading === p.key ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Upgrade to ${p.name}`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Account Management */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Account Management</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <p className="text-sm text-gray-500 mb-4">Manage your password, email, and connected accounts.</p>
            <div className="max-w-full overflow-hidden">
              <UserProfile
                routing="hash"
                appearance={{
                  variables: { colorPrimary: '#6C3AED', borderRadius: '12px' },
                  elements: {
                    rootBox: 'w-full max-w-full',
                    card: 'shadow-none border-0 p-0 max-w-full',
                    pageScrollBox: 'max-w-full overflow-x-hidden',
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
