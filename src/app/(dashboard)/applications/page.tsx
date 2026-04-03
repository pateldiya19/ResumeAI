'use client';

import { useEffect, useState } from 'react';

interface Application {
  _id: string;
  recipientName: string;
  recipientCompany: string;
  tone: string;
  status: string;
  sentAt: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/applications')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setApps(Array.isArray(data) ? data : []))
      .catch(() => setApps([]))
      .finally(() => setIsLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    sent: 'bg-blue-100 text-blue-700',
    opened: 'bg-emerald-100 text-emerald-700',
    replied: 'bg-purple-100 text-purple-700',
    bounced: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sent Applications</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(160, 84%, 39%)' }} />
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          <p className="text-gray-500 mb-2">No applications sent yet.</p>
          <p className="text-sm text-gray-400">
            Run an analysis and send a cold email to see it here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Recipient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app._id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(app.sentAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{app.recipientName}</td>
                  <td className="px-4 py-3 text-gray-600">{app.recipientCompany}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{app.tone.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
