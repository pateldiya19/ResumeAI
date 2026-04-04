'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check, RefreshCw, Loader2, Linkedin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface LinkedInData { headlines: string[]; summary: string }

export function LinkedInOptimizer() {
  const [data, setData] = useState<LinkedInData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate/linkedin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setData(await res.json());
      setGenerated(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally { setLoading(false); }
  };

  const copyText = (text: string, idx?: number) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
    if (idx !== undefined) { setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000); }
    else { setCopiedSummary(true); setTimeout(() => setCopiedSummary(false), 2000); }
  };

  if (!generated) {
    return (
      <Card>
        <CardContent className="p-5 text-center">
          <Linkedin className="w-8 h-8 text-blue-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Optimize Your LinkedIn</h3>
          <p className="text-xs text-gray-500 mb-4">Generate professional headlines and an about section based on your resume</p>
          <div className="flex items-center gap-2 max-w-xs mx-auto mb-3">
            <Input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="Target role (optional)" className="text-xs h-9" />
          </div>
          <Button onClick={generate} disabled={loading} size="sm" className="gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Linkedin className="w-3.5 h-3.5" />}
            Generate
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <Card><CardContent className="p-5 space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-32" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><Linkedin className="w-4 h-4 text-blue-500" /> LinkedIn Content</span>
          <Button variant="ghost" size="sm" onClick={generate} disabled={loading} className="text-xs gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Regenerate
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Headlines */}
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Headlines</p>
        {data?.headlines?.map((h, i) => (
          <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100">
            <p className="text-sm text-gray-800 flex-1 leading-relaxed">{h}</p>
            <button onClick={() => copyText(h, i)} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-400">
              {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}

        {/* Summary */}
        {data?.summary && (
          <>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-4">About Section</p>
            <div className="p-4 rounded-xl bg-gray-50 ring-1 ring-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.summary}</p>
              <div className="flex justify-end mt-3">
                <button onClick={() => copyText(data.summary)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition">
                  {copiedSummary ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
