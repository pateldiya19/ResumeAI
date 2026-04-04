'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  credits: number;
  isBanned: boolean;
  createdAt: string;
  analyses: { _id: string; status: string; createdAt: string; scores?: { overallScore?: number } }[];
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [addCredits, setAddCredits] = useState('');

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const doAction = async (action: string, body?: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser((prev) => (prev ? { ...prev, ...updated } : prev));
      }
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-gray-500">User not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-zinc-50 transition">
        &larr; Back to Users
      </button>

      {/* User card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          {user.isBanned && (
            <span className="text-xs font-bold bg-red-600 text-zinc-50 px-2 py-1 rounded">BANNED</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Plan</p>
            <p className="font-medium capitalize">{typeof user.plan === 'string' ? user.plan : 'free'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Role</p>
            <p className="font-medium capitalize">{user.role}</p>
          </div>
          <div>
            <p className="text-zinc-500">Credits</p>
            <p className="font-medium">{user.credits}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mt-4">
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Actions</h2>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => doAction(user.isBanned ? 'unban' : 'ban')}
            disabled={actionLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
              user.isBanned
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {user.isBanned ? 'Unban User' : 'Ban User'}
          </button>

          <select
            value={typeof user.plan === 'string' ? user.plan : 'free'}
            onChange={(e) => doAction('changePlan', { plan: e.target.value })}
            disabled={actionLoading}
            className="px-3 py-2 bg-gray-100 border border-zinc-700 rounded-lg text-sm focus:outline-none"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Add Credits</label>
            <input
              type="number"
              min="1"
              value={addCredits}
              onChange={(e) => setAddCredits(e.target.value)}
              className="px-3 py-2 bg-gray-100 border border-zinc-700 rounded-lg text-sm text-zinc-50 w-32 focus:outline-none"
              placeholder="Amount"
            />
          </div>
          <button
            onClick={() => {
              if (addCredits && Number(addCredits) > 0) {
                doAction('addCredits', { amount: Number(addCredits) });
                setAddCredits('');
              }
            }}
            disabled={actionLoading || !addCredits}
            className="px-4 py-2 bg-blue-600 text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Recent analyses */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Analyses</h2>
        {(!user.analyses || user.analyses.length === 0) ? (
          <p className="text-zinc-500 text-sm">No analyses.</p>
        ) : (
          <div className="space-y-2">
            {user.analyses.map((a) => (
              <div key={a._id} className="flex items-center justify-between text-sm py-2 border-b border-gray-200 last:border-0">
                <div>
                  <span className="text-gray-700 font-mono text-xs">{a._id.slice(-8)}</span>
                  <span className="text-zinc-500 ml-3">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {a.scores?.overallScore != null && (
                    <span className="text-emerald-400 font-medium">{a.scores.overallScore}%</span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      a.status === 'complete'
                        ? 'bg-emerald-900 text-emerald-300'
                        : a.status === 'failed'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-yellow-900 text-yellow-300'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
