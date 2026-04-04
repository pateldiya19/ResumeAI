'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useEffect, useState } from 'react';
import { FileText, Target, Mail, BarChart3, Brain, Rocket } from 'lucide-react';

const BASE_DELAY = 0.3;

const BentoCard = ({
  title, description, children, className, ...props
}: { title?: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-3xl border border-white/5 bg-[#121212] text-white', className)} {...props}>
    {(title || description) && (
      <div className="flex w-full flex-1 flex-col p-6 pb-0">
        {title && <div className="w-full text-white">{title}</div>}
        {description && <div className="w-full text-neutral-500 mt-2">{description}</div>}
      </div>
    )}
    <div className={cn(!title && !description ? 'p-0' : 'p-6 pt-4')}>{children}</div>
  </div>
);

// ATS Score chart data
const yearlyData = [45, 62, 78, 55, 87, 92, 89];
const monthlyData = [30, 45, 52, 40, 65, 72, 68];
const CHART_HEIGHT = 200;
const BAR_WIDTH = 44;
const GAP = 12;
const labels = ['Resume', 'Keywords', 'Format', 'Structure', 'Verbs', 'Metrics', 'Overall'];

const ATSChartCard = () => {
  const [isOptimized, setIsOptimized] = useState(false);
  useEffect(() => { const i = setInterval(() => setIsOptimized(p => !p), 3000); return () => clearInterval(i); }, []);
  const data = isOptimized ? yearlyData : monthlyData;

  return (
    <BentoCard className="col-span-1 flex flex-col py-4 sm:px-6 md:col-span-3"
      title={<span className="block text-center text-2xl font-bold text-neutral-200 md:text-3xl">ATS Score Breakdown</span>}
      description={<span className="text-center text-sm text-neutral-600 block">See how each section of your resume performs</span>}>
      <div className="relative flex flex-col space-y-4 overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a1a] p-4 md:p-6">
        <div className="flex w-full items-center justify-between">
          <span className="text-base font-medium text-neutral-400">Score Analysis</span>
          <motion.span layout className="inline-flex items-center rounded-full bg-neutral-950 px-3 py-1.5 text-[10px] text-neutral-400 shadow-[inset_0_1px_0px_rgba(255,255,255,0.2)]">
            <AnimatePresence mode="popLayout">
              <motion.span key={isOptimized ? 'after' : 'before'}
                initial={{ opacity: 0, filter: 'blur(4px)', y: -15 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                exit={{ opacity: 0, filter: 'blur(4px)', y: 15 }} transition={{ duration: 0.4 }} className="block">
                {isOptimized ? 'After AI' : 'Before AI'}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        </div>
        <div className="w-full">
          <motion.svg viewBox={`0 0 ${data.length * (BAR_WIDTH + GAP)} ${CHART_HEIGHT}`} className="w-full">
            <defs>
              <linearGradient id="atsBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            {data.map((height, i) => {
              const h = (height / 100) * CHART_HEIGHT;
              return (
                <motion.rect key={i} x={i * (BAR_WIDTH + GAP)} width={BAR_WIDTH} rx={4}
                  initial={{ height: 0, y: CHART_HEIGHT }}
                  animate={{ height: h, y: CHART_HEIGHT - h }}
                  transition={{ duration: 0.6, delay: isOptimized ? i * 0.08 : (data.length - 1 - i) * 0.08, ease: [0.65, 0, 0.35, 1] }}
                  fill="url(#atsBarGrad)" />
              );
            })}
          </motion.svg>
          <div className="mt-2 flex justify-between px-0.5">
            {labels.map((l, i) => <span key={i} className="w-[40px] text-center text-[8px] text-neutral-600">{l}</span>)}
          </div>
        </div>
      </div>
    </BentoCard>
  );
};

const featureDots = [
  { x: '50%', y: '8%', icon: FileText },
  { x: '50%', y: '92%', icon: Mail },
  { x: '-5%', y: '30%', icon: Target },
  { x: '-5%', y: '70%', icon: BarChart3 },
  { x: '15%', y: '50%', icon: Brain },
  { x: '105%', y: '30%', icon: Rocket },
  { x: '105%', y: '70%', icon: FileText },
  { x: '85%', y: '50%', icon: Mail },
];
const delays = featureDots.map(() => BASE_DELAY + Math.random() * 0.8);

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  hover: { scale: 1.02 },
};
const lineVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 0.5, opacity: 1, transition: { duration: 1.6, ease: 'easeInOut' } },
  hover: { pathLength: 1, opacity: 1, transition: { duration: 1, ease: 'easeInOut' } },
};
const containerVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const avatarVariants: Variants = {
  hidden: { x: 60, opacity: 0 },
  visible: (i: number) => ({ x: 0, opacity: 1, transition: { delay: BASE_DELAY + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
};

const avatars = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/40.jpg',
  'https://randomuser.me/api/portraits/men/78.jpg',
];

export default function BentoGrid() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-6">
      {/* Hero card */}
      <BentoCard className="col-span-1 flex flex-col items-center justify-between overflow-hidden pt-8 pl-8 md:col-span-6 md:flex-row"
        title={<span className="flex-1 text-3xl leading-tight font-bold tracking-tight md:text-4xl">Resume Intelligence<br />Powered by AI</span>}
        description={<span className="text-base leading-relaxed text-neutral-500">Upload once. Get your ATS score, recruiter persona, optimized bullets, and personalized cold emails — all in under 60 seconds.</span>}>
        <motion.div variants={cardVariants} initial="hidden" whileInView="visible" whileHover="hover" viewport={{ once: true }}
          className="relative flex w-full flex-col items-center space-y-6 overflow-hidden rounded-tl-3xl border border-white/10 bg-[#1a1a1a] [mask-image:linear-gradient(to_top,transparent_0%,black_40%)] p-6 md:w-[350px] md:rounded-tl-4xl">
          <div className="absolute top-0 left-0 size-120 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-2xl" />
          <div className="flex w-full items-center justify-between">
            <span className="text-2xl font-bold text-white md:text-3xl">87</span>
            <div className="flex gap-2">
              <span className="rounded-full bg-black px-2 py-1 text-[10px] text-neutral-400 shadow-[inset_0_1px_0px_rgba(255,255,255,0.2)]">ATS SCORE</span>
              <span className="rounded-full bg-black px-2 py-1 text-[10px] text-emerald-400 shadow-[inset_0_1px_0px_rgba(255,255,255,0.2)]">STRONG</span>
            </div>
          </div>
          <div className="flex w-full flex-col-reverse items-start gap-3">
            {[0, 20, 40, 60, 80, 100].map((val) => (
              <div key={val} className="flex w-full items-center gap-3">
                <span className="w-6 text-right text-[10px] text-neutral-600">{val}</span>
                <div className="h-px w-full bg-white/5" />
              </div>
            ))}
            <svg width="336" height="200" viewBox="0 0 336 200" fill="none" className="absolute w-full">
              <motion.path variants={lineVariants} d="M30 140C50 120 80 60 110 90C140 120 160 40 190 70C220 100 250 30 280 50C310 70 330 45 340 40" stroke="#7c3aed" strokeWidth="3" />
              <path d="M30 140C50 120 80 60 110 90C140 120 160 40 190 70C220 100 250 30 280 50C310 70 330 45 340 40" stroke="#ffffff08" strokeWidth="3" />
            </svg>
          </div>
        </motion.div>
      </BentoCard>

      {/* ATS Chart */}
      <ATSChartCard />

      {/* Right column — 3 cards */}
      <div className="col-span-1 grid grid-cols-1 gap-4 md:col-span-3">
        {/* AI Network */}
        <BentoCard className="relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden py-4"
          title={<span className="block text-center text-xl font-bold">AI-Powered Pipeline</span>}>
          <div className="flex w-full items-center justify-center">
            <div className="relative flex h-28 w-36 items-center justify-center">
              <div className="z-10 flex size-11 items-center justify-center rounded-full border-4 border-brand-600 bg-white shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                <div className="size-5 rounded-full bg-brand-500" />
              </div>
              {featureDots.map((dot, i) => (
                <motion.div key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ opacity: 1, scale: [1, 0.85, 1], transition: { scale: { delay: delays[i], duration: 1, repeat: Infinity, ease: 'easeInOut' } } }}
                  className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600"
                  style={{ left: dot.x, top: dot.y }}>
                  <dot.icon className="size-3.5 text-white" />
                </motion.div>
              ))}
            </div>
          </div>
        </BentoCard>

        {/* Tagline */}
        <BentoCard className="relative flex items-center justify-center p-6">
          <h3 className="text-center text-xl font-bold text-white">Every Resume. Uniquely Optimized.</h3>
        </BentoCard>

        {/* Users + Avatars */}
        <BentoCard className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row"
          title={<span className="mx-auto block w-[120px] text-center text-xl leading-tight font-bold sm:text-left">Trusted by<br />10,000+</span>}>
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} className="flex justify-center -space-x-3 sm:justify-end">
            {avatars.map((img, i) => (
              <motion.div key={i} variants={avatarVariants} custom={i}
                whileHover={{ scale: 1.05, y: -5, zIndex: 50 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative flex size-11 cursor-pointer items-center justify-center rounded-full bg-brand-600 p-0.5 md:size-14">
                <div className="relative size-full overflow-hidden rounded-full border-2 border-black">
                  <img src={img} alt="user" className="absolute inset-0 size-full rounded-full object-cover" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </BentoCard>
      </div>
    </div>
  );
}
