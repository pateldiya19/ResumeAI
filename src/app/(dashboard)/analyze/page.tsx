'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Target, Rocket, ArrowRight, Check, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { cn } from '@/lib/cn';

const modes = [
  {
    title: 'Resume Check',
    subtitle: 'Instant ATS health score',
    description: 'Detailed section analysis, formatting issues, and bullet improvement suggestions.',
    icon: FileText,
    href: '/analyze/resume-check',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'hover:border-blue-200',
    time: '~15 sec',
    features: ['ATS compatibility score', 'Section-by-section breakdown', 'Bullet improvements', 'Formatting issues'],
  },
  {
    title: 'Job Match',
    subtitle: 'Resume vs job description',
    description: 'Compare your resume against a specific job posting with skill gap analysis.',
    icon: Target,
    href: '/analyze/job-match',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'hover:border-purple-200',
    time: '~20 sec',
    features: ['Job fit score + radar chart', 'Matched & missing skills', 'Keyword gap analysis', 'Tailored bullet rewrites'],
  },
  {
    title: 'Full Application',
    subtitle: 'Complete pipeline',
    description: 'Analyze a recruiter, generate personalized emails, and optimize your resume.',
    icon: Rocket,
    href: '/analyze/full-application',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'hover:border-brand-200',
    time: '~60 sec',
    features: ['Recruiter persona analysis', '3 personalized cold emails', 'Resume optimization', 'One-click email sending'],
  },
];

export default function AnalyzeLandingPage() {
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Choose Analysis Mode</h1>
          <p className="text-sm text-gray-500">Each mode builds on the previous. Start with a quick check or go full pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <motion.div
                key={mode.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={mode.href} className="block h-full">
                  <Card className={cn('group h-full border border-gray-200 hover:shadow-lg transition-all cursor-pointer', mode.borderColor)}>
                    <CardContent className="p-5 flex flex-col h-full">
                      {/* Icon + time */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', mode.bgColor)}>
                          <Icon className={cn('w-5 h-5', mode.color)} />
                        </div>
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                          <Clock className="w-3 h-3" />{mode.time}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mb-0.5">{mode.title}</h3>
                      <p className="text-xs text-gray-400 mb-3">{mode.subtitle}</p>
                      <p className="text-sm text-gray-500 mb-4 leading-relaxed flex-1">{mode.description}</p>

                      {/* Features */}
                      <div className="space-y-2 mb-4">
                        {mode.features.map((f) => (
                          <div key={f} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-xs text-gray-600">{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors mt-auto pt-3 border-t border-gray-100">
                        Start Analysis
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
