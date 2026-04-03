'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';

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

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Sent Applications</h1>

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : apps.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Mail className="w-7 h-7" />}
              title="No applications sent yet"
              description="Run an analysis and send a cold email to see it here."
              actionLabel="Start Analysis"
              actionHref="/analyze"
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Recipient</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Company</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Tone</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {new Date(app.sentAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-gray-900 font-medium">{app.recipientName}</td>
                      <td className="px-5 py-4 text-gray-500">{app.recipientCompany}</td>
                      <td className="px-5 py-4">
                        <Badge variant={
                          app.tone === 'professional' ? 'blue' :
                          app.tone === 'conversational' ? 'warning' : 'purple'
                        }>
                          {app.tone.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
