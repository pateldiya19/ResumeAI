'use client';

import { useEffect, useState } from 'react';
import { Mail, Heart, Send, Star } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface FavoriteEmail {
  analysisId: string;
  emailIndex: number;
  subject: string;
  body: string;
  tone: string;
  targetName: string;
  targetCompany: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [favorites, setFavorites] = useState<FavoriteEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch sent applications
    fetch('/api/user/applications')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setApps(Array.isArray(data) ? data : []))
      .catch(() => setApps([]));

    // Fetch favorited emails from analyses
    fetch('/api/analyze')
      .then((r) => (r.ok ? r.json() : []))
      .then((analyses) => {
        if (!Array.isArray(analyses)) return;
        const favs: FavoriteEmail[] = [];
        for (const a of analyses) {
          if (a.generatedEmails) {
            a.generatedEmails.forEach((email: Record<string, unknown>, idx: number) => {
              if (email.isFavorite) {
                favs.push({
                  analysisId: a._id,
                  emailIndex: idx,
                  subject: email.subject as string,
                  body: (email.body as string || '').slice(0, 100) + '...',
                  tone: email.tone as string,
                  targetName: a.target?.name || 'Recruiter',
                  targetCompany: a.target?.company || '',
                });
              }
            });
          }
        }
        setFavorites(favs);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>

        {isLoading ? (
          <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
        ) : (
          <>
            {/* Favorited Emails */}
            {favorites.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    Saved Emails ({favorites.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {favorites.map((fav, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={fav.tone === 'professional' ? 'blue' : fav.tone === 'conversational' ? 'warning' : 'purple'} className="text-[10px]">
                            {fav.tone.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-400">{fav.targetName}{fav.targetCompany ? ` at ${fav.targetCompany}` : ''}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">{fav.subject}</p>
                      </div>
                      <Link href={`/results/${fav.analysisId}`}>
                        <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1.5">
                          <Send className="w-3 h-3" /> View & Send
                        </Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Sent Applications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Sent Applications ({apps.length})
                </CardTitle>
              </CardHeader>
              {apps.length === 0 ? (
                <CardContent>
                  <div className="text-center py-8">
                    <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No emails sent yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Favorite an email from your analysis results, then send it from here.</p>
                  </div>
                </CardContent>
              ) : (
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
                          <td className="px-5 py-4 text-gray-500 text-xs">{new Date(app.sentAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4 text-gray-900 font-medium">{app.recipientName}</td>
                          <td className="px-5 py-4 text-gray-500">{app.recipientCompany}</td>
                          <td className="px-5 py-4">
                            <Badge variant={app.tone === 'professional' ? 'blue' : app.tone === 'conversational' ? 'warning' : 'purple'}>
                              {app.tone.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-5 py-4"><StatusBadge status={app.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}
