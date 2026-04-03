'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCredits } from '@/hooks/use-credits';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { credits, plan, usage } = useCredits();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const user = session?.user;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }
      setPwMsg({ type: 'success', text: 'Password updated successfully' });
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwLoading(false);
    }
  };

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
            {(user?.name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
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

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        {pwMsg && (
          <div
            className={`mb-4 p-3 text-sm rounded-lg border ${
              pwMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {pwMsg.text}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Min 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="px-6 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
          >
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
