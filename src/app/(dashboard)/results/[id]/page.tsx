'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAnalysis } from '@/hooks/use-analysis';
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
  pending: 'Queued',
  scraping_candidate: 'Scraping your LinkedIn',
  scraping_target: 'Scraping recruiter LinkedIn',
  parsing_jd: 'Parsing job description',
  analyzing: 'Running AI analysis',
  generating: 'Generating emails',
  complete: 'Complete',
  failed: 'Failed',
};

type Tab = 'scores' | 'resume' | 'emails' | 'persona';

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const { analysis, isLoading, error } = useAnalysis(id);
  const [activeTab, setActiveTab] = useState<Tab>('scores');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [sendingIdx, setSendingIdx] = useState<number | null>(null);

  if (isLoading && !analysis) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(160, 84%, 39%)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-red-600 font-medium">Error: {error}</p>
      </div>
    );
  }

  if (!analysis) return null;

  // In-progress state
  if (!['complete', 'failed'].includes(analysis.status)) {
    const currentIdx = statusSteps.indexOf(analysis.status as AnalysisStatus);
    return (
      <div className="max-w-lg mx-auto py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Analysis in Progress</h1>
        <p className="text-gray-500 text-center mb-8">This usually takes 30-60 seconds.</p>
        <div className="space-y-3">
          {statusSteps.slice(0, -1).map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < currentIdx
                    ? 'bg-emerald-500 text-white'
                    : i === currentIdx
                    ? 'border-2 border-emerald-500 text-emerald-600 animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i < currentIdx ? '\u2713' : i + 1}
              </div>
              <span className={`text-sm ${i <= currentIdx ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {statusLabels[step]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (analysis.status === 'failed') {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h1>
        <p className="text-gray-500">Something went wrong. Please try again with a new analysis.</p>
      </div>
    );
  }

  // Complete state
  const { scores, optimizedResume, generatedEmails, recruiterPersona, canSendEmail } = analysis;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'scores', label: 'Scores' },
    { key: 'resume', label: 'Resume' },
    { key: 'emails', label: 'Emails' },
    { key: 'persona', label: 'Persona' },
  ];

  const copyEmail = (idx: number) => {
    const email = generatedEmails[idx];
    if (!email) return;
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const sendEmail = async (idx: number) => {
    setSendingIdx(idx);
    try {
      const res = await fetch(`/api/analyze/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIndex: idx }),
      });
      if (!res.ok) throw new Error('Failed to send');
      alert('Email sent successfully!');
    } catch {
      alert('Failed to send email. Please try again.');
    } finally {
      setSendingIdx(null);
    }
  };

  const ScoreBar = ({ label, value, max = 100 }: { label: string; value: number; max?: number }) => (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: 'hsl(160, 84%, 39%)' }}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scores Tab */}
      {activeTab === 'scores' && scores && (
        <div className="space-y-6">
          {/* Overall */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">Overall Score</p>
            <p className="text-5xl font-bold" style={{ color: 'hsl(160, 84%, 39%)' }}>
              {scores.overallScore}%
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ATS */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">ATS Score: {scores.atsScore}%</h3>
              <ScoreBar label="Keyword Match" value={scores.atsBreakdown.keywordMatch} />
              <ScoreBar label="Formatting" value={scores.atsBreakdown.formatting} />
              <ScoreBar label="Section Structure" value={scores.atsBreakdown.sectionStructure} />
              <ScoreBar label="Parsability" value={scores.atsBreakdown.parsability} />
            </div>

            {/* Job Fit */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Job Fit: {scores.jobFitScore}%</h3>
              <ScoreBar label="Skill Coverage" value={scores.jobFitBreakdown.skillCoverage} />
              <ScoreBar label="Experience" value={scores.jobFitBreakdown.experienceAlignment} />
              <ScoreBar label="Seniority" value={scores.jobFitBreakdown.seniorityMatch} />
              <ScoreBar label="Industry" value={scores.jobFitBreakdown.industryRelevance} />
            </div>

            {/* Consistency */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">
                Consistency: {scores.consistencyScore}%
              </h3>
              {scores.consistencyIssues.length === 0 ? (
                <p className="text-sm text-gray-500">No issues found.</p>
              ) : (
                <div className="space-y-2">
                  {scores.consistencyIssues.map((issue, i) => (
                    <div key={i} className="text-sm">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mr-2 ${
                          issue.severity === 'high'
                            ? 'bg-red-100 text-red-700'
                            : issue.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      {issue.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resume Tab */}
      {activeTab === 'resume' && optimizedResume && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Optimized Professional Summary</h3>
            <p className="text-sm text-gray-700">{optimizedResume.professionalSummary}</p>
          </div>

          {/* Bullets */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Optimized Bullets</h3>
            <div className="space-y-4">
              {optimizedResume.bullets.map((b, i) => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1 uppercase font-medium">Original</p>
                      <p className="text-sm text-gray-600">{b.original}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-medium mb-1" style={{ color: 'hsl(160, 84%, 39%)' }}>Optimized</p>
                      <p className="text-sm text-gray-900 font-medium">{b.optimized}</p>
                    </div>
                  </div>
                  {b.changes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {b.changes.map((c, j) => (
                        <span key={j} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Keywords & Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Suggested Skills</h3>
              <div className="flex flex-wrap gap-2">
                {optimizedResume.suggestedSkills.map((s, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Keywords Added</h3>
              <div className="flex flex-wrap gap-2">
                {optimizedResume.keywordsAdded.map((k, i) => (
                  <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emails Tab */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          {generatedEmails.length === 0 ? (
            <p className="text-gray-500">No emails generated yet.</p>
          ) : (
            generatedEmails.map((email, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      email.tone === 'professional'
                        ? 'bg-blue-100 text-blue-700'
                        : email.tone === 'conversational'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {email.tone.replace('_', ' ')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyEmail(idx)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      {copiedIdx === idx ? 'Copied!' : 'Copy'}
                    </button>
                    {canSendEmail && (
                      <button
                        onClick={() => sendEmail(idx)}
                        disabled={sendingIdx === idx}
                        className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition disabled:opacity-50"
                        style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
                      >
                        {sendingIdx === idx ? 'Sending...' : 'Send'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-2">Subject: {email.subject}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{email.body}</p>
                {email.matchPoints.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {email.matchPoints.map((p, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Persona Tab */}
      {activeTab === 'persona' && recruiterPersona && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{recruiterPersona.name}</h2>
            <p className="text-sm text-gray-500">{recruiterPersona.headline}</p>
            <p className="text-sm font-medium" style={{ color: 'hsl(160, 84%, 39%)' }}>
              {recruiterPersona.company}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium mb-1">Communication Style</p>
              <p className="text-sm text-gray-700 capitalize">{recruiterPersona.communicationStyle}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium mb-1">Recommended Approach</p>
              <p className="text-sm text-gray-700">{recruiterPersona.recommendedApproach}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-2">Priorities</p>
            <div className="flex flex-wrap gap-2">
              {recruiterPersona.priorities.map((p, i) => (
                <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{p}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-2">Pain Points</p>
            <div className="flex flex-wrap gap-2">
              {recruiterPersona.painPoints.map((p, i) => (
                <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">{p}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-2">Recent Topics</p>
            <div className="flex flex-wrap gap-2">
              {recruiterPersona.recentTopics.map((t, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-2">Cultural Signals</p>
            <div className="flex flex-wrap gap-2">
              {recruiterPersona.culturalSignals.map((s, i) => (
                <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
