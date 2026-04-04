'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Search, MapPin, ExternalLink, Target, Rocket, Loader2, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import { cn } from '@/lib/cn';

interface Job {
  id: string; title: string; company: string; location: string; salary: string;
  description: string; url: string; postedDate: string; source: string;
  matchScore: number; matchedSkills: string[]; missingSkills: string[];
}

export default function JobScannerPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState<'indeed' | 'naukri' | 'both'>('indeed');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { toast.error('Enter a job role'); return; }
    setLoading(true); setSearched(true); setJobs([]);
    try {
      const res = await fetch('/api/jobs/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobs(data.jobs || []);
      if (data.jobs?.length === 0) toast.info('No jobs found. Try a different search.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally { setLoading(false); }
  };

  const scoreColor = (s: number) => s >= 80 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : s >= 60 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-red-50 text-red-600 ring-red-200';
  const scoreDot = (s: number) => s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Scanner</h1>
          <p className="text-sm text-gray-500">Find jobs that match your resume — ranked by fit</p>
        </div>

        {/* Search form */}
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Job role (e.g. Software Engineer)" className="pl-9" />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g. Bangalore)" className="pl-9" />
              </div>
              <select value={source} onChange={e => setSource(e.target.value as 'indeed' | 'naukri' | 'both')}
                className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white">
                <option value="indeed">Indeed</option>
                <option value="naukri">Naukri</option>
                <option value="both">Both</option>
              </select>
              <Button type="submit" disabled={loading} className="gap-2 bg-gray-900 hover:bg-gray-800 text-white h-10">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Scan
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">Scanning {source} for &ldquo;{query}&rdquo;{location ? ` in ${location}` : ''}...</p>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <div className="space-y-3">
            {jobs.length === 0 && <p className="text-center text-gray-400 py-12">No jobs found. Try a broader search.</p>}
            <AnimatePresence>
              {jobs.map((job, i) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ring-1', scoreColor(job.matchScore))}>
                          <span className="text-lg font-bold">{job.matchScore}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                            <div className={cn('w-2 h-2 rounded-full shrink-0', scoreDot(job.matchScore))} />
                          </div>
                          <p className="text-sm text-gray-500">{job.company}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                            {job.salary && <span>{job.salary}</span>}
                            {job.postedDate && <span>{job.postedDate}</span>}
                            <Badge variant="default" className="text-[9px]">{job.source}</Badge>
                          </div>
                          {/* Skills */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.matchedSkills.slice(0, 5).map(s => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{s}</span>)}
                            {job.missingSkills.slice(0, 3).map(s => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600">{s}</span>)}
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedId === job.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4 border-t border-gray-100">
                          {job.description && <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-6">{job.description.slice(0, 500)}...</p>}
                          <div className="flex gap-2">
                            {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><ExternalLink className="w-3 h-3" /> View Original</Button></a>}
                            <Link href={`/analyze/job-match?jd=${encodeURIComponent(job.description?.slice(0, 2000) || job.title)}`}>
                              <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Target className="w-3 h-3" /> Analyze Fit</Button>
                            </Link>
                            <Link href={`/analyze/full-application?jd=${encodeURIComponent(job.description?.slice(0, 2000) || job.title)}`}>
                              <Button size="sm" className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-500 text-white"><Rocket className="w-3 h-3" /> Quick Apply</Button>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
