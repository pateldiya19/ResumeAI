'use client';

import { motion } from 'framer-motion';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { ScoreBar } from '@/components/ui/score-bar';
import { VerdictBadge } from '@/components/shared/verdict-badge';
import { SkillPill } from '@/components/shared/skill-pill';
import { BulletComparison } from '@/components/shared/bullet-comparison';
import { JobMatchRadar } from '@/components/results/job-match-radar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Mode2Results } from '@/types/analysis';

interface JobMatchResultsProps {
  data: Mode2Results;
}

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export function JobMatchResults({ data }: JobMatchResultsProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger.container}
      className="space-y-6"
    >
      {/* ── Score Hero: Two Gauges ── */}
      <motion.div variants={stagger.item}>
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-purple-500 to-cyan-500" />
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-12">
              {/* Job Match Score */}
              <div className="text-center">
                <ScoreGauge score={data.job_match_score} size="lg" label="Job Match" />
                <div className="mt-2">
                  <VerdictBadge verdict={data.fit_verdict} size="md" />
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-32 bg-gray-100" />
              <div className="sm:hidden w-32 h-px bg-gray-100" />

              {/* ATS Score */}
              <div className="text-center">
                <ScoreGauge score={data.ats_score} size="lg" label="ATS Score" />
                <div className="mt-2">
                  <VerdictBadge verdict={data.ats_label} size="md" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Radar Chart ── */}
      {data.radar_scores && (
        <motion.div variants={stagger.item}>
          <JobMatchRadar scores={data.radar_scores} />
        </motion.div>
      )}

      {/* ── Skill Analysis ── */}
      <motion.div variants={stagger.item}>
        <Card>
          <CardHeader>
            <CardTitle>Skill Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Matched Skills */}
            {data.matched_skills && data.matched_skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Matched Skills ({data.matched_skills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.matched_skills.map((skill, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <SkillPill skill={skill} variant="matched" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {data.missing_skills && data.missing_skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Missing Skills ({data.missing_skills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.missing_skills.map((skill, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <SkillPill skill={skill} variant="missing" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section Scores ── */}
      <motion.div variants={stagger.item}>
        <Card>
          <CardHeader>
            <CardTitle>Section Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScoreBar label="Keyword Match" value={data.section_scores.keyword_match} />
            <ScoreBar label="Skill Coverage" value={data.section_scores.skill_coverage} />
            <ScoreBar label="Experience Relevance" value={data.section_scores.experience_relevance} />
            <ScoreBar label="Formatting" value={data.section_scores.formatting} />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Resume Improvements ── */}
      {data.resume_improvements && data.resume_improvements.length > 0 && (
        <motion.div variants={stagger.item}>
          <Card>
            <CardHeader>
              <CardTitle>Recommended Improvements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.resume_improvements.map((improvement, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 pl-4 border-l-2 border-brand-300"
                  >
                    <span className="text-xs font-bold text-brand-400 shrink-0 mt-0.5 w-5">
                      {i + 1}.
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{improvement}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Optimized Bullets ── */}
      {data.weak_bullets && data.weak_bullets.length > 0 && (
        <motion.div variants={stagger.item}>
          <Card>
            <CardHeader>
              <CardTitle>Optimized Bullets for This Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {data.weak_bullets.map((bullet, i) => (
                <BulletComparison
                  key={i}
                  original={bullet.original}
                  suggestion={bullet.suggestion}
                  index={i}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
