'use client';

import { useEffect, useState } from 'react';

interface FlaggedItem {
  _id: string;
  type: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export default function AdminModerationPage() {
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/admin/moderation${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.items || []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const handleAction = async (itemId: string, action: 'approve' | 'reject' | 'ban') => {
    setActionLoading(itemId);
    try {
      const res = await fetch(`/api/admin/moderation/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        // Remove from list or update status
        if (action === 'approve') {
          setItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, status: 'approved' } : i)));
        } else if (action === 'reject' || action === 'ban') {
          setItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, status: 'rejected' } : i)));
        }
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-900 text-yellow-300',
    approved: 'bg-emerald-900 text-emerald-300',
    rejected: 'bg-red-900 text-red-300',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moderation Queue</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-lg w-fit">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition capitalize ${
              filter === f ? 'bg-zinc-700 text-zinc-50' : 'text-gray-500 hover:text-zinc-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-400">No {filter !== 'all' ? filter : ''} items in the queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full uppercase">
                      {item.type}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    By <span className="font-medium text-zinc-50">{item.userName}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>

              <p className="text-sm text-red-400 mb-2">Reason: {item.reason}</p>
              <p className="text-sm text-gray-500 bg-gray-100/50 rounded-lg p-3 line-clamp-3">{item.content}</p>

              {item.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleAction(item._id, 'approve')}
                    disabled={actionLoading === item._id}
                    className="px-4 py-1.5 text-xs font-medium bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(item._id, 'reject')}
                    disabled={actionLoading === item._id}
                    className="px-4 py-1.5 text-xs font-medium bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Ban this user? This will also reject the content.')) {
                        handleAction(item._id, 'ban');
                      }
                    }}
                    disabled={actionLoading === item._id}
                    className="px-4 py-1.5 text-xs font-medium bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Ban User
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
