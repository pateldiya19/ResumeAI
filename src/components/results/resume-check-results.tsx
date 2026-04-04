'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, XCircle, PenLine } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { ScoreBar } from '@/components/ui/score-bar';
import { VerdictBadge } from '@/components/shared/verdict-badge';
import { BulletComparison } from '@/components/shared/bullet-comparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Mode1Results } from '@/types/analysis';

const CHART_COLORS = ['#7C3AED', '#2563EB', '#06B6D4', '#10B981', '#F59E0B'];

interface ResumeCheckResultsProps {
  data: Mode1Results;
}

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export function ResumeCheckResults({ data }: ResumeCheckResultsProps) {
  const router = useRouter();
  const [selectedFixes, setSelectedFixes] = useState<Set<string>>(new Set());

  const toggleFix = (fix: string) => {
    setSelectedFixes((prev) => {
      const next = new Set(prev);
      if (next.has(fix)) next.delete(fix);
      else next.add(fix);
      return next;
    });
  };

  const handleFixATS = () => {
    // Store selected fixes in sessionStorage for the editor to pick up
    sessionStorage.setItem('ats-fixes', JSON.stringify(Array.from(selectedFixes)));
    router.push('/editor');
  };

  // Collect all fixable items
  const allFixes: string[] = [];
  if (data.formatting_issues) data.formatting_issues.forEach((i) => allFixes.push(i.message));
  if (data.missing_sections) data.missing_sections.forEach((s) => allFixes.push(`Add missing "${s}" section`));
  if (data.weak_bullets) data.weak_bullets.forEach((b) => allFixes.push(`Improve: "${b.original.slice(0, 60)}..."`));

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger.container}
      className="space-y-6"
    >
      {/* ── Overall Verdict ── */}
      <motion.div variants={stagger.item}>
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-brand-500 to-blue-500" />
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreGauge score={data.ats_score} size="lg" label="ATS Score" />
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Your resume is{' '}
                  <span className={
                    data.ats_score >= 80 ? 'text-emerald-600' :
                    data.ats_score >= 60 ? 'text-blue-600' : 'text-red-600'
                  }>
                    {data.ats_label}
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mb-3">
                  {data.ats_score >= 80
                    ? 'Great job! Your resume is well-optimized for ATS systems.'
                    : data.ats_score >= 60
                    ? 'Your resume is decent but has room for improvement.'
                    : 'Your resume needs work to pass ATS filters.'}
                </p>
                <VerdictBadge verdict={data.overall_verdict} size="lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Fix ATS Issues (checkboxes) ── */}
      {allFixes.length > 0 && (
        <motion.div variants={stagger.item}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Select Issues to Fix
                </CardTitle>
                <Button
                  onClick={handleFixATS}
                  disabled={selectedFixes.size === 0}
                  size="sm"
                  className="gap-2 bg-brand-600 hover:bg-brand-500 text-white"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Fix in Editor ({selectedFixes.size})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {allFixes.map((fix, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFixes.has(fix)}
                    onChange={() => toggleFix(fix)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 mt-0.5 shrink-0"
                  />
                  <span className="text-sm text-gray-700">{fix}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Section Scores Chart ── */}
      <motion.div variants={stagger.item}>
        <Card>
          <CardHeader>
            <CardTitle>Section Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[200px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Contact', score: data.section_scores.contact_info },
                    { name: 'Format', score: data.section_scores.formatting },
                    { name: 'Structure', score: data.section_scores.section_structure },
                    { name: 'Verbs', score: data.section_scores.action_verbs },
                    { name: 'Metrics', score: data.section_scores.quantification },
                  ]}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v}/100`, 'Score']} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={32}>
                    {[0, 1, 2, 3, 4].map((i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <ScoreBar label="Contact Info" value={data.section_scores.contact_info} />
              <ScoreBar label="Formatting" value={data.section_scores.formatting} />
              <ScoreBar label="Section Structure" value={data.section_scores.section_structure} />
              <ScoreBar label="Action Verbs" value={data.section_scores.action_verbs} />
              <ScoreBar label="Quantification" value={data.section_scores.quantification} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Formatting Issues ── */}
      {data.formatting_issues && data.formatting_issues.length > 0 && (
        <motion.div variants={stagger.item}>
          <Card>
            <CardHeader>
              <CardTitle>Issues Found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.formatting_issues.map((issue, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-2.5">
                  {issue.type === 'error' ? <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                  <span className="text-sm text-gray-700">{issue.message}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Missing Sections ── */}
      {data.missing_sections && data.missing_sections.length > 0 && (
        <motion.div variants={stagger.item}>
          <Card>
            <CardHeader><CardTitle>Missing Sections</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.missing_sections.map((section, i) => (
                  <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="bg-red-50 text-red-600 ring-1 ring-red-200 rounded-full px-3 py-1 text-xs font-medium">{section}</motion.span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Weak Bullets ── */}
      {data.weak_bullets && data.weak_bullets.length > 0 && (
        <motion.div variants={stagger.item}>
          <Card>
            <CardHeader><CardTitle>Bullet Improvements</CardTitle></CardHeader>
            <CardContent className="space-y-8">
              {data.weak_bullets.map((bullet, i) => (
                <BulletComparison key={i} original={bullet.original} suggestion={bullet.suggestion} index={i} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
