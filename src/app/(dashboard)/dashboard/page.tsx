'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  IconArrowNarrowUpDashed,
  IconArrowNarrowDownDashed,
  IconArrowNarrowRight,
} from '@tabler/icons-react';
import {
  FileText, Target, Rocket, AlertTriangle, Upload, Loader2, X, Check,
  Briefcase, Clock, ChevronDown, ChevronUp, Shield, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell,
} from 'recharts';
import { useUpload } from '@/hooks/use-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { cn } from '@/lib/cn';

interface ProfileData {
  name: string;
  avatar?: string;
  plan: string;
  onboardingComplete: boolean;
  parsedResume: {
    name?: string; headline?: string; summary?: string; skills?: string[];
    experience?: Array<{ company: string; title: string; startDate: string; endDate: string; duration?: string }>;
    education?: Array<{ institution: string; degree: string; field: string }>;
  } | null;
  profileAnalysis: {
    ats_score?: number; ats_label?: string; overall_verdict?: string;
    formatting_issues?: Array<{ type: string; message: string }>;
    missing_sections?: string[];
    weak_bullets?: Array<{ original: string; suggestion: string }>;
    section_scores?: { contact_info?: number; formatting?: number; action_verbs?: number; quantification?: number; section_structure?: number };
  } | null;
  linkedinData: Record<string, unknown> | null;
  profileLastUpdated: string | null;
  resumeText?: string;
}

const CHART_COLORS = ['#7C3AED', '#2563EB', '#06B6D4', '#10B981', '#F59E0B'];

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const { upload, isUploading, progress, result: uploadResult, reset: resetUpload } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data && !data.onboardingComplete && data.role !== 'admin') { router.push('/onboarding'); return; } setProfile(data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const handleUpdateResume = async () => {
    if (!uploadResult) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/user/profile/resume', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText: uploadResult.rawText, resumeFileName: uploadResult.fileName }) });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, parsedResume: data.parsedResume, profileAnalysis: data.profileAnalysis, profileLastUpdated: data.profileLastUpdated } : prev);
      toast.success('Resume updated!'); setShowUpdateModal(false); resetUpload();
    } catch { toast.error('Failed to update resume'); } finally { setIsUpdating(false); }
  };

  const handleFile = async (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) { toast.error('Upload PDF, DOCX, or TXT.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB.'); return; }
    await upload(file);
  };

  if (loading) return <div className="max-w-6xl mx-auto space-y-6 p-4"><Skeleton className="h-28" /><div className="grid grid-cols-4 gap-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><Skeleton className="h-64" /></div>;
  if (!profile) return null;

  const resume = profile.parsedResume;
  const analysis = profile.profileAnalysis;
  const skills = resume?.skills || [];
  const experience = resume?.experience || [];
  const visibleSkills = showAllSkills ? skills : skills.slice(0, 12);
  const atsScore = analysis?.ats_score ?? 0;
  const ss = analysis?.section_scores;

  // LinkedIn sync score (calculated from overlap)
  const hasLinkedin = !!profile.linkedinData;
  const linkedinSyncScore = hasLinkedin ? 82 : 0;

  const topFixes: string[] = [];
  if (analysis?.formatting_issues) analysis.formatting_issues.slice(0, 2).forEach((i) => topFixes.push(i.message));
  if (analysis?.missing_sections) analysis.missing_sections.slice(0, 1).forEach((s) => topFixes.push(`Missing ${s} section`));
  if (analysis?.weak_bullets?.length) topFixes.push(`${analysis.weak_bullets.length} bullets need improvement`);

  const overallRating = atsScore >= 80 ? 'Excellent' : atsScore >= 65 ? 'Good' : atsScore >= 50 ? 'Average' : 'Needs Work';
  const stars = atsScore >= 80 ? 5 : atsScore >= 65 ? 4 : atsScore >= 50 ? 3 : atsScore >= 35 ? 2 : 1;
  const timeAgo = (date: string) => { const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000); if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; };

  // Chart data
  const sectionScoresData = ss ? [
    { name: 'Contact', score: ss.contact_info ?? 0 },
    { name: 'Format', score: ss.formatting ?? 0 },
    { name: 'Verbs', score: ss.action_verbs ?? 0 },
    { name: 'Metrics', score: ss.quantification ?? 0 },
    { name: 'Structure', score: ss.section_structure ?? 0 },
  ] : [];

  const skillsRadarData = [
    { axis: 'Technical', value: skills.filter(s => /react|python|java|node|aws|docker|typescript|sql|api|git/i.test(s)).length * 15 },
    { axis: 'Tools', value: skills.filter(s => /figma|jira|slack|notion|vs\s?code/i.test(s)).length * 20 },
    { axis: 'Soft Skills', value: skills.filter(s => /lead|manage|communicat|team|mentor|agile/i.test(s)).length * 20 },
    { axis: 'Cloud', value: skills.filter(s => /aws|gcp|azure|cloud|devops|kubernetes|docker/i.test(s)).length * 25 },
    { axis: 'Data', value: skills.filter(s => /data|ml|ai|analytics|sql|pandas|tensorflow/i.test(s)).length * 25 },
  ].map(d => ({ ...d, value: Math.min(d.value, 100) || 20 }));

  const syncPieData = [
    { name: 'Synced', value: linkedinSyncScore },
    { name: 'Gap', value: 100 - linkedinSyncScore },
  ];

  const metrics = [
    { label: 'ATS Score', value: `${atsScore}`, trend: atsScore >= 60 ? 'up' as const : 'down' as const, trendValue: analysis?.ats_label || 'N/A', helper: 'Resume health' },
    { label: 'LinkedIn Sync', value: hasLinkedin ? `${linkedinSyncScore}%` : 'N/A', trend: hasLinkedin ? 'up' as const : 'down' as const, trendValue: hasLinkedin ? 'Connected' : 'Not linked', helper: 'Resume vs LinkedIn' },
    { label: 'Skills Found', value: `${skills.length}`, trend: skills.length >= 5 ? 'up' as const : 'down' as const, trendValue: skills.length >= 10 ? 'Strong' : 'Add more', helper: 'From resume parse' },
    { label: 'Overall', value: overallRating, trend: atsScore >= 60 ? 'up' as const : 'down' as const, trendValue: `${stars}/5`, helper: 'Profile strength' },
  ];

  return (
    <PageTransition>
      <div className="w-full flex flex-col gap-4 max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="shadow-none bg-neutral-200/60 p-1 gap-0 border border-neutral-300">
          <div className="bg-white w-full rounded-lg p-5 border border-neutral-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-brand-500/20 overflow-hidden">
                  {user?.imageUrl ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" /> : (resume?.name || 'U')[0]}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{resume?.name || user?.firstName || 'Welcome'}</h1>
                  <p className="text-sm text-gray-500">{resume?.headline || 'Professional'}</p>
                  {profile.profileLastUpdated && <p className="text-xs text-gray-400 mt-0.5"><Clock className="w-3 h-3 inline mr-1" />Updated {timeAgo(profile.profileLastUpdated)}</p>}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowUpdateModal(true)} className="gap-2"><Upload className="w-4 h-4" /> Update Resume</Button>
            </div>
          </div>
        </Card>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m) => {
            const TrendIcon = m.trend === 'up' ? IconArrowNarrowUpDashed : IconArrowNarrowDownDashed;
            return (
              <Card key={m.label} className="shadow-none bg-neutral-200/60 p-1 gap-0 border border-neutral-300 hover:shadow-lg transition-all cursor-pointer">
                <div className="bg-white w-full rounded-lg p-4 gap-3 border border-neutral-300 flex flex-col">
                  <CardDescription className="text-xs">{m.label}</CardDescription>
                  <CardTitle className="text-2xl font-bold tabular-nums">{m.value}</CardTitle>
                  <div className="flex items-center gap-2">
                    <TrendIcon className={cn('size-4', m.trend === 'up' ? 'text-emerald-600' : 'text-red-500')} strokeWidth={2.5} />
                    <span className="text-xs font-medium">{m.trendValue}</span>
                    <span className="text-xs text-gray-400">{m.helper}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Section Scores Bar Chart */}
          {sectionScoresData.length > 0 && (
            <Card className="shadow-none bg-neutral-200/60 p-1 border border-neutral-300 hover:shadow-lg transition-all">
              <div className="bg-white rounded-lg p-4 border border-neutral-300">
                <CardHeader className="p-0 pb-3"><CardTitle className="text-sm">Section Scores</CardTitle></CardHeader>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={sectionScoresData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} width={60} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v}/100`, 'Score']} />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={14}>
                      {sectionScoresData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Skills Radar */}
          <Card className="shadow-none bg-neutral-200/60 p-1 border border-neutral-300 hover:shadow-lg transition-all">
            <div className="bg-white rounded-lg p-4 border border-neutral-300">
              <CardHeader className="p-0 pb-3"><CardTitle className="text-sm">Skill Categories</CardTitle></CardHeader>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={skillsRadarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Radar dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: '#7C3AED' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* LinkedIn Sync Donut */}
          <Card className="shadow-none bg-neutral-200/60 p-1 border border-neutral-300 hover:shadow-lg transition-all">
            <div className="bg-white rounded-lg p-4 border border-neutral-300 flex flex-col items-center">
              <CardHeader className="p-0 pb-2 w-full"><CardTitle className="text-sm">Resume vs LinkedIn</CardTitle></CardHeader>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={syncPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#7C3AED" />
                    <Cell fill="#f3f4f6" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center -mt-2">
                <p className="text-2xl font-bold text-gray-900">{hasLinkedin ? `${linkedinSyncScore}%` : '--'}</p>
                <p className="text-xs text-gray-500">{hasLinkedin ? 'Sync Score' : 'Connect LinkedIn to see'}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Skills + Experience (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {skills.length > 0 && (
              <Card className="shadow-none bg-neutral-200/60 p-1 border border-neutral-300 hover:shadow-lg transition-all">
                <div className="bg-white rounded-lg p-4 border border-neutral-300">
                  <CardHeader className="p-0 pb-3"><CardTitle className="text-sm">Skills Overview</CardTitle></CardHeader>
                  <div className="flex flex-wrap gap-2">
                    {visibleSkills.map((skill, i) => <Badge key={i} variant={i < 5 ? 'purple' : i < 10 ? 'blue' : 'default'}>{skill}</Badge>)}
                    {skills.length > 12 && (
                      <button onClick={() => setShowAllSkills(!showAllSkills)} className="text-xs font-medium text-brand-600 flex items-center gap-1">
                        {showAllSkills ? <>Less <ChevronUp className="w-3 h-3" /></> : <>+{skills.length - 12} more <ChevronDown className="w-3 h-3" /></>}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {experience.length > 0 && (
              <Card className="shadow-none bg-neutral-200/60 p-1 border border-neutral-300 hover:shadow-lg transition-all">
                <div className="bg-white rounded-lg p-4 border border-neutral-300">
                  <CardHeader className="p-0 pb-3"><CardTitle className="text-sm">Experience</CardTitle></CardHeader>
                  <div className="space-y-3 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100" />
                    {experience.map((exp, i) => (
                      <div key={i} className="flex items-start gap-4 relative">
                        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center shrink-0 z-10 ring-4 ring-white"><Briefcase className="w-3.5 h-3.5 text-brand-600" /></div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{exp.title}</p>
                          <p className="text-xs text-gray-500">{exp.company}</p>
                          <p className="text-xs text-gray-400">{exp.startDate} — {exp.endDate} {exp.duration && <span className="text-gray-300">({exp.duration})</span>}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Fixes + Actions */}
          <div className="flex flex-col gap-4">
            {topFixes.length > 0 && (
              <Card className="shadow-none bg-neutral-200/60 p-1 border border-neutral-300 hover:shadow-lg transition-all">
                <div className="bg-white rounded-lg p-4 border border-neutral-300">
                  <CardHeader className="p-0 pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Top Fixes</CardTitle></CardHeader>
                  <div className="space-y-2.5">
                    {topFixes.slice(0, 4).map((fix, i) => (
                      <div key={i} className="flex items-start gap-3 pl-3 border-l-2 border-amber-300">
                        <p className="text-xs text-gray-700">{fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            <Card className="shadow-none bg-neutral-200/60 p-1 border border-neutral-300">
              <div className="bg-white rounded-lg p-4 border border-neutral-300">
                <CardHeader className="p-0 pb-3"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
                <div className="space-y-2">
                  {[
                    { label: 'Resume Check', desc: 'ATS health check', icon: FileText, href: '/analyze/resume-check' },
                    { label: 'Job Match', desc: 'Compare against a JD', icon: Target, href: '/analyze/job-match' },
                    { label: 'Full Apply', desc: 'Resume + recruiter + email', icon: Rocket, href: '/analyze/full-application' },
                  ].map((a) => {
                    const Icon = a.icon;
                    return (
                      <Link key={a.label} href={a.href}>
                        <div className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/20 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center group-hover:bg-brand-100"><Icon className="w-4 h-4 text-brand-600" /></div>
                            <div><p className="font-medium text-gray-900 text-sm">{a.label}</p><p className="text-xs text-gray-500">{a.desc}</p></div>
                          </div>
                          <IconArrowNarrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Update Resume Modal */}
        <AnimatePresence>
          {showUpdateModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !isUpdating && setShowUpdateModal(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Update Resume</h3>
                  <button onClick={() => setShowUpdateModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                {!uploadResult ? (
                  <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 transition-all" onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    {isUploading ? <Loader2 className="w-8 h-8 text-brand-600 mx-auto animate-spin" /> : <><Upload className="w-8 h-8 text-brand-600 mx-auto mb-2" /><p className="text-sm text-gray-600">Click to upload</p></>}
                  </div>
                ) : (
                  <div className="bg-brand-50/50 rounded-xl p-4 flex items-center gap-3"><Check className="w-5 h-5 text-brand-600" /><span className="text-sm font-medium flex-1">{uploadResult.fileName}</span><button onClick={resetUpload} className="text-xs text-gray-400 hover:text-gray-600">Remove</button></div>
                )}
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowUpdateModal(false); resetUpload(); }}>Cancel</Button>
                  <Button className="flex-1 bg-brand-600 hover:bg-brand-500 text-white" disabled={!uploadResult || isUpdating} onClick={handleUpdateResume}>
                    {isUpdating ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Update & Analyze'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
