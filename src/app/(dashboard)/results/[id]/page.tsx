'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Copy,
  Check,
  Send,
  AlertTriangle,
  XCircle,
  BarChart3,
  FileText,
  Mail,
  User,
  ListChecks,
  ArrowRight,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAnalysis } from '@/hooks/use-analysis';
import { ScoreGauge, getScoreColor } from '@/components/ui/score-gauge';
import { ScoreBar } from '@/components/ui/score-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { ComposeEmailCard } from '@/components/ui/compose-email/compose-email-card';
import { cn } from '@/lib/cn';
import type { AnalysisStatus } from '@/types/analysis';

const statusSteps: AnalysisStatus[] = [
  'pending',
  'scraping_candidate',
  'scraping_target',
  'parsing_jd',
  'analyzing',
  'generating',
  'complete',
];

const statusLabels: Record<string, string> = {
  pending: 'Initializing',
  scraping_candidate: 'Parsing your resume',
  scraping_target: 'Analyzing recruiter profile',
  parsing_jd: 'Processing job description',
  analyzing: 'Running AI analysis',
  generating: 'Generating content',
  complete: 'Complete',
  failed: 'Failed',
};

type Tab = 'scores' | 'resume' | 'emails' | 'persona' | 'actions';

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'scores', label: 'Scores', icon: BarChart3 },
  { key: 'resume', label: 'Resume', icon: FileText },
  { key: 'emails', label: 'Emails', icon: Mail },
  { key: 'persona', label: 'Persona', icon: User },
  { key: 'actions', label: 'Actions', icon: ListChecks },
];

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const { analysis, isLoading, error } = useAnalysis(id);
  const [activeTab, setActiveTab] = useState<Tab>('scores');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [sendingIdx, setSendingIdx] = useState<number | null>(null);
  const [checkedActions, setCheckedActions] = useState<Set<string>>(new Set());

  // Loading state
  if (isLoading && !analysis) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analysis</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (!analysis) return null;

  // ── In-progress state ──
  if (!['complete', 'failed'].includes(analysis.status)) {
    const currentIdx = statusSteps.indexOf(analysis.status as AnalysisStatus);
    const progress = Math.max(((currentIdx + 0.5) / (statusSteps.length - 1)) * 100, 5);

    return (
      <PageTransition>
        <div className="max-w-lg mx-auto py-16">
          <div className="text-center mb-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5"
            >
              <BarChart3 className="w-8 h-8 text-brand-600" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Analysis in Progress</h1>
            <p className="text-sm text-gray-500">This usually takes 30-60 seconds.</p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-2 rounded-full bg-brand-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-gray-400 text-right mt-1.5">{Math.round(progress)}%</p>
          </div>

          {/* Steps */}
          <Card>
            <CardContent className="p-5">
              <div className="space-y-3">
                {statusSteps.slice(0, -1).map((step, i) => {
                  const isComplete = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                          isComplete && 'bg-brand-600 text-white',
                          isCurrent && 'bg-brand-100 text-brand-700 ring-2 ring-brand-300',
                          !isComplete && !isCurrent && 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {isComplete ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          isCurrent ? (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-2 h-2 rounded-full bg-brand-600"
                            />
                          ) : (
                            i + 1
                          )
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm',
                          isComplete && 'text-gray-900 font-medium',
                          isCurrent && 'text-brand-700 font-semibold',
                          !isComplete && !isCurrent && 'text-gray-400'
                        )}
                      >
                        {statusLabels[step]}
                      </span>
                      {isCurrent && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="ml-auto"
                        >
                          <span className="text-xs text-brand-500">Processing...</span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // ── Failed state ──
  if (analysis.status === 'failed') {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h1>
          <p className="text-sm text-gray-500 mb-6">
            {analysis.errorMessage || 'Something went wrong. Please try again.'}
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </PageTransition>
    );
  }

  // ── Complete state ──
  const { scores, optimizedResume, generatedEmails, recruiterPersona, canSendEmail } = analysis;

  const copyEmail = (idx: number) => {
    const email = generatedEmails[idx];
    if (!email) return;
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopiedIdx(idx);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const sendEmail = async (idx: number) => {
    setSendingIdx(idx);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: id, emailIndex: idx }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      toast.success('Email sent successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setSendingIdx(null);
    }
  };

  const toggleAction = (key: string) => {
    setCheckedActions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build action items from analysis data
  const actionItems: { key: string; text: string; priority: 'high' | 'medium' | 'low' }[] = [];
  if (scores?.consistencyIssues) {
    scores.consistencyIssues.forEach((issue, i) => {
      actionItems.push({ key: `ci-${i}`, text: issue.description, priority: issue.severity as 'high' | 'medium' | 'low' });
    });
  }
  if (optimizedResume?.formattingFixes) {
    optimizedResume.formattingFixes.forEach((fix, i) => {
      actionItems.push({ key: `ff-${i}`, text: fix, priority: 'medium' });
    });
  }
  if (optimizedResume?.suggestedSkills) {
    optimizedResume.suggestedSkills.forEach((skill, i) => {
      actionItems.push({ key: `ss-${i}`, text: `Add "${skill}" to your resume`, priority: 'low' });
    });
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>
            {analysis.target?.name && (
              <p className="text-sm text-gray-500 mt-0.5">
                {analysis.target.name}{analysis.target.company ? ` at ${analysis.target.company}` : ''}
              </p>
            )}
          </div>
          {scores && (
            <ScoreGauge score={scores.overallScore} size="sm" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl w-fit overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                  isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-white shadow-sm rounded-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── SCORES TAB ── */}
            {activeTab === 'scores' && scores && (
              <div className="space-y-6">
                {/* Overall score hero */}
                <Card className="p-8">
                  <div className="flex flex-col items-center">
                    <ScoreGauge score={scores.overallScore} size="lg" label="Overall Score" />
                  </div>
                </Card>

                {/* 3 score cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="hover:shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span>ATS Score</span>
                        <ScoreGauge score={scores.atsScore} size="sm" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {scores.atsBreakdown ? (
                        <>
                          <ScoreBar label="Keyword Match" value={scores.atsBreakdown.keywordMatch} />
                          <ScoreBar label="Formatting" value={scores.atsBreakdown.formatting} />
                          <ScoreBar label="Structure" value={scores.atsBreakdown.sectionStructure} />
                          <ScoreBar label="Parsability" value={scores.atsBreakdown.parsability} />
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">No breakdown available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span>Job Fit</span>
                        <ScoreGauge score={scores.jobFitScore} size="sm" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {scores.jobFitBreakdown ? (
                        <>
                          <ScoreBar label="Skills" value={scores.jobFitBreakdown.skillCoverage} />
                          <ScoreBar label="Experience" value={scores.jobFitBreakdown.experienceAlignment} />
                          <ScoreBar label="Seniority" value={scores.jobFitBreakdown.seniorityMatch} />
                          <ScoreBar label="Industry" value={scores.jobFitBreakdown.industryRelevance} />
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">No breakdown available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span>Consistency</span>
                        <ScoreGauge score={scores.consistencyScore} size="sm" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!scores.consistencyIssues || scores.consistencyIssues.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                          <Check className="w-4 h-4" />
                          No issues found
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {scores.consistencyIssues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Badge
                                variant={issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'default'}
                                className="shrink-0 mt-0.5"
                              >
                                {issue.severity}
                              </Badge>
                              <span className="text-sm text-gray-600">{issue.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── RESUME TAB ── */}
            {activeTab === 'resume' && optimizedResume && (
              <div className="space-y-5">
                {/* Summary */}
                <Card className="border-l-4 border-l-brand-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-4 h-4 text-brand-600" />
                      AI Professional Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed">{optimizedResume.professionalSummary}</p>
                  </CardContent>
                </Card>

                {/* Bullets */}
                <Card>
                  <CardHeader>
                    <CardTitle>Optimized Bullets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {optimizedResume.bullets.map((b, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-gray-50 pb-5 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400">Bullet {i + 1}</span>
                          {b.relevanceScore != null && (
                            <Badge variant={b.relevanceScore >= 80 ? 'success' : b.relevanceScore >= 50 ? 'blue' : 'default'}>
                              {b.relevanceScore}% relevant
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Original</p>
                            <p className="text-sm text-gray-500">{b.original}</p>
                          </div>
                          <div className="rounded-xl bg-brand-50/50 p-3 ring-1 ring-brand-100">
                            <p className="text-[10px] font-semibold text-brand-500 uppercase mb-1">Optimized</p>
                            <p className="text-sm text-gray-900 font-medium">{b.optimized}</p>
                          </div>
                        </div>
                        {b.changes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {b.changes.map((c, j) => (
                              <Badge key={j} variant="purple" className="text-[10px]">{c}</Badge>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* Keywords & Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Suggested Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {optimizedResume.suggestedSkills.map((s, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <Badge variant="blue">{s}</Badge>
                          </motion.span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Keywords Added</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {optimizedResume.keywordsAdded.map((k, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <Badge variant="purple">{k}</Badge>
                          </motion.span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── EMAILS TAB ── */}
            {activeTab === 'emails' && (
              <div className="space-y-4">
                {/* Recruiter email status */}
                <Card className={canSendEmail ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${canSendEmail ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      <Mail className={`w-4 h-4 ${canSendEmail ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${canSendEmail ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {canSendEmail ? 'Recruiter email found — you can send directly' : 'Recruiter email not found — copy and send manually'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {canSendEmail ? 'Click "Send" on any email below to deliver it via ResumeAI' : 'Use the "Copy" button to copy the email and paste it in your email client'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {generatedEmails.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No emails generated yet.</p>
                  </Card>
                ) : (
                  generatedEmails.map((email, idx) => (
                    <ComposeEmailCard
                      key={idx}
                      data={{
                        from: { name: analysis.candidate?.name || 'You', email: '' },
                        to: { name: analysis.target?.name || 'Recruiter', email: (analysis as Record<string, unknown>).targetEmail as string || '' },
                        subject: email.subject,
                        body: email.body,
                        tone: email.tone,
                      }}
                      onCopy={() => copyEmail(idx)}
                      onSend={() => sendEmail(idx)}
                      onFavorite={async () => {
                        try {
                          const res = await fetch(`/api/analyze/${id}/favorite`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ emailIndex: idx, isFavorite: !email.isFavorite }),
                          });
                          if (res.ok) {
                            toast.success(email.isFavorite ? 'Removed from favorites' : 'Saved to Applications');
                            window.location.reload();
                          }
                        } catch { toast.error('Failed to update'); }
                      }}
                      isFavorite={!!email.isFavorite}
                      isSending={sendingIdx === idx}
                      canSend={canSendEmail}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── PERSONA TAB ── */}
            {activeTab === 'persona' && recruiterPersona && (
              <div className="space-y-4">
                {/* Profile card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-xl font-bold text-white shrink-0">
                        {recruiterPersona.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900">{recruiterPersona.name}</h2>
                        <p className="text-sm text-gray-500 truncate">{recruiterPersona.headline}</p>
                        <p className="text-sm font-medium text-brand-600">{recruiterPersona.company}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="purple">{recruiterPersona.communicationStyle} style</Badge>
                          {canSendEmail && <Badge variant="success">Email available</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Approach */}
                {recruiterPersona.recommendedApproach && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">How to Approach</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{recruiterPersona.recommendedApproach}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Tags grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recruiterPersona.priorities?.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Priorities</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {recruiterPersona.priorities.map((p, i) => <Badge key={i} variant="success" className="text-xs">{p}</Badge>)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {recruiterPersona.painPoints?.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pain Points</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {recruiterPersona.painPoints.map((p, i) => <Badge key={i} variant="error" className="text-xs">{p}</Badge>)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {recruiterPersona.recentTopics?.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Topics</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {recruiterPersona.recentTopics.map((t, i) => <Badge key={i} variant="blue" className="text-xs">{t}</Badge>)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {recruiterPersona.culturalSignals?.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cultural Signals</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {recruiterPersona.culturalSignals.map((s, i) => <Badge key={i} variant="purple" className="text-xs">{s}</Badge>)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* ── ACTIONS TAB ── */}
            {activeTab === 'actions' && (
              <div className="space-y-5">
                {actionItems.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-gray-500">No action items — your resume looks great!</p>
                  </Card>
                ) : (
                  <>
                    {/* Progress */}
                    <Card className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">Progress</span>
                        <span className="text-sm text-gray-500">
                          {checkedActions.size}/{actionItems.length} completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-2 rounded-full bg-brand-600"
                          animate={{ width: `${actionItems.length ? (checkedActions.size / actionItems.length) * 100 : 0}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </Card>

                    {/* Items grouped by priority */}
                    {(['high', 'medium', 'low'] as const).map((priority) => {
                      const items = actionItems.filter((a) => a.priority === priority);
                      if (items.length === 0) return null;
                      return (
                        <div key={priority}>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                priority === 'high' && 'bg-red-500',
                                priority === 'medium' && 'bg-amber-500',
                                priority === 'low' && 'bg-blue-500'
                              )}
                            />
                            {priority} priority
                          </h3>
                          <Card>
                            <CardContent className="p-0 divide-y divide-gray-50">
                              {items.map((item) => (
                                <label
                                  key={item.key}
                                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checkedActions.has(item.key)}
                                    onChange={() => toggleAction(item.key)}
                                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                  />
                                  <span
                                    className={cn(
                                      'text-sm transition-all',
                                      checkedActions.has(item.key) ? 'text-gray-400 line-through' : 'text-gray-700'
                                    )}
                                  >
                                    {item.text}
                                  </span>
                                </label>
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
