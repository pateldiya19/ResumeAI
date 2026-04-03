'use client';

import { useUser, UserProfile } from '@clerk/nextjs';
import { useCredits } from '@/hooks/use-credits';

export default function SettingsPage() {
  const { user } = useUser();
  const { credits, plan, usage } = useCredits();

  const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-emerald-100 text-emerald-700',
    enterprise: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold"
            style={{ color: 'hsl(160, 84%, 39%)' }}
          >
            {(user?.fullName || user?.primaryEmailAddress?.emailAddress || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.fullName || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </div>

      {/* Plan & Usage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan & Usage</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Plan</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${planColors[plan] || planColors.free}`}>
              {plan.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Credits Remaining</span>
            <span className="text-sm font-medium text-gray-900">{credits}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Analyses This Month</span>
            <span className="text-sm font-medium text-gray-900">
              {usage.analysesUsed} / {usage.analysesLimit}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Emails Sent This Month</span>
            <span className="text-sm font-medium text-gray-900">
              {usage.sendsUsed} / {usage.sendsLimit}
            </span>
          </div>
        </div>
      </div>

      {/* Account Management (Clerk handles password, email, etc.) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h2>
        <p className="text-sm text-gray-500 mb-4">
          Manage your password, email, and connected accounts through your profile.
        </p>
        <UserProfile
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border-0 p-0',
            },
          }}
        />
      </div>
    </div>
  );
}
