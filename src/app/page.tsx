'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import {
  Upload, Target, Send, FileText, Brain, BarChart3, Mail, Rocket,
  Zap, Check, X, ArrowRight, Star, Menu,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const GradientBlinds = dynamic(() => import('@/components/ui/gradient-blinds'), { ssr: false });
// ScrollReveal and ScrollStack components available at @/components/ui/ if needed

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, { duration: 2, ease: 'easeOut', onUpdate: (v) => setDisplay(Math.round(v * 10) / 10) });
    return controls.stop;
  }, [isInView, value]);
  return <span ref={ref}>{display}{suffix}</span>;
}

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } },
};

const features = [
  { title: 'Smart Resume Parsing', desc: 'Drop your PDF or DOCX. Our AI extracts every detail — experience, skills, education — and structures it in seconds.', icon: FileText },
  { title: 'Recruiter Intelligence', desc: 'Know exactly who you\'re reaching out to. We analyze their LinkedIn for communication style, priorities, and pain points.', icon: Target },
  { title: 'AI Resume Rewriting', desc: 'Weak bullets become powerful impact statements. Every line optimized with metrics, action verbs, and JD keywords.', icon: Brain },
  { title: 'ATS Compatibility Score', desc: 'See exactly how an ATS reads your resume. Detailed breakdown across keywords, formatting, structure, and parsability.', icon: BarChart3 },
  { title: 'Personalized Cold Emails', desc: 'Three tone variants per recruiter — professional, conversational, and mutual connection. Each one uniquely crafted.', icon: Mail },
  { title: 'One-Click Sending', desc: 'Send directly from ResumeAI. No copy-paste, no tab switching. Track opens and clicks in real time.', icon: Rocket, pro: true },
];

const plans = [
  { name: 'Free', price: '$0', period: '/mo', desc: 'Try it out — no commitment', features: ['3 analyses per month', 'ATS & Job Fit scoring', 'Resume download', 'Email copy'], excluded: ['One-click send', 'Full recruiter persona'], cta: 'Get Started', popular: false },
  { name: 'Pro', price: '$19', period: '/mo', desc: 'For serious job seekers', features: ['Unlimited analyses', '10 sends per month', 'Full recruiter persona', 'Project portfolio', 'Delivery tracking'], excluded: ['Batch mode'], cta: 'Start Free Trial', popular: true },
  { name: 'Enterprise', price: '$49', period: '/mo', desc: 'For teams and power users', features: ['Everything in Pro', 'Unlimited sends', 'Batch mode', 'Team seats', 'Priority processing'], excluded: [], cta: 'Contact Sales', popular: false },
];

const testimonials = [
  { name: 'Priya Mehta', role: 'Software Engineer', company: 'Hired at Stripe', quote: 'Went from zero callbacks to four interviews in two weeks. The recruiter persona feature completely changed my approach.', stars: 5 },
  { name: 'Alex Kim', role: 'Product Manager', company: 'Hired at Notion', quote: 'My ATS score jumped from 52 to 89 after using the AI rewriter. The before/after comparison was eye-opening.', stars: 5 },
  { name: 'Sarah Liu', role: 'Data Scientist', company: 'Hired at Anthropic', quote: 'Sent 10 personalized cold emails in the time it used to take me to write one. Three of them got replies.', stars: 5 },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ── GLASSMORPHISM FLOATING PILL NAVBAR ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-4xl rounded-full px-6 h-14 flex items-center justify-between transition-all duration-500 ${
            scrolled
              ? 'bg-white/60 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 ring-1 ring-black/[0.03]'
              : 'bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
          }`}
        >
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-blue-400 flex items-center justify-center text-[10px] font-black text-white">R</div>
            <span className={`text-sm font-bold transition-colors duration-500 ${scrolled ? 'text-gray-900' : 'text-white'}`}>ResumeAI</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className={`text-sm transition-colors duration-500 ${scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/60 hover:text-white'}`}>Features</a>
            <a href="#pricing" className={`text-sm transition-colors duration-500 ${scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/60 hover:text-white'}`}>Pricing</a>
            <a href="#testimonials" className={`text-sm transition-colors duration-500 ${scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/60 hover:text-white'}`}>Reviews</a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isSignedIn ? (
              <Link href="/dashboard"><button className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-500 ${scrolled ? 'text-white bg-gray-900 hover:bg-gray-800' : 'text-gray-900 bg-white hover:bg-gray-100'}`}>Dashboard</button></Link>
            ) : (
              <>
                <Link href="/sign-in"><button className={`text-sm px-3 py-1.5 transition-colors duration-500 ${scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/60 hover:text-white'}`}>Log in</button></Link>
                <Link href="/sign-up"><button className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-500 ${scrolled ? 'text-white bg-gray-900 hover:bg-gray-800' : 'text-gray-900 bg-white hover:bg-gray-100'}`}>Get Started</button></Link>
              </>
            )}
          </div>

          <button className={`md:hidden p-1 transition-colors ${scrolled ? 'text-gray-700' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </motion.nav>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 left-4 right-4 z-50 bg-white/80 backdrop-blur-2xl rounded-2xl border border-gray-200/80 p-4 space-y-3 shadow-xl">
          <a href="#features" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#pricing" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <div className="flex gap-2 pt-2">
            {isSignedIn ? (
              <Link href="/dashboard" className="flex-1"><button className="w-full text-sm font-semibold text-white bg-gray-900 rounded-xl py-2">Dashboard</button></Link>
            ) : (
              <>
                <Link href="/sign-in" className="flex-1"><button className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl py-2">Log in</button></Link>
                <Link href="/sign-up" className="flex-1"><button className="w-full text-sm font-semibold text-white bg-gray-900 rounded-xl py-2">Get Started</button></Link>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* ── HERO — DARK with GradientBlinds ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-[#050510]">
        {/* GradientBlinds background */}
        <div className="absolute inset-0">
          <GradientBlinds
            gradientColors={['#FF9FFC', '#5227FF']}
            angle={0}
            noise={0.3}
            blindCount={12}
            blindMinWidth={50}
            spotlightRadius={0.5}
            spotlightSoftness={1}
            spotlightOpacity={1}
            mouseDampening={0.15}
            distortAmount={0}
            shineDirection="left"
            mixBlendMode="lighten"
          />
        </div>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-[#050510]/50" />

        <div className="relative z-10 max-w-4xl mx-auto text-center pt-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] mb-8">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-xs font-medium text-white/70">Built for serious job seekers</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="text-5xl md:text-7xl lg:text-[80px] font-bold tracking-tight text-white leading-[1.05] mb-8">
            Stop applying blind.{' '}
            <span className="bg-gradient-to-r from-[#c4b5fd] via-[#93c5fd] to-[#67e8f9] bg-clip-text text-transparent">Start landing.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            One platform that scores your resume, finds what recruiters actually want, and writes the cold email for you.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-base px-8 h-12 rounded-xl font-semibold shadow-2xl shadow-white/10">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="text-base h-12 rounded-xl border-white/15 text-white hover:bg-white/5">
                How It Works
              </Button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 md:gap-16">
            {[{ value: '94%', label: 'ATS Pass Rate' }, { value: '3.2x', label: 'More Interviews' }, { value: '10K+', label: 'Users' }].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </div>
        </motion.div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="py-8 border-b border-gray-100 overflow-hidden bg-white">
        <p className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-5">Trusted by job seekers at</p>
        <div className="relative"><div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, setIdx) => (<div key={setIdx} className="flex items-center gap-16 mx-8">
            {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Stripe', 'Figma'].map((n) => (
              <span key={`${setIdx}-${n}`} className="text-lg font-bold text-gray-200 select-none">{n}</span>
            ))}
          </div>))}
        </div></div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger.container} className="text-center mb-20">
            <motion.p variants={stagger.item} className="text-sm font-semibold text-brand-600 mb-3">How it works</motion.p>
            <motion.h2 variants={stagger.item} className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Three steps. Sixty seconds.</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger.container} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload', desc: 'Drop your PDF or DOCX. AI extracts skills, experience, and education instantly.', icon: Upload },
              { step: '02', title: 'Target', desc: "Add a recruiter's LinkedIn and a job posting. We build the intelligence.", icon: Target },
              { step: '03', title: 'Launch', desc: 'Get your ATS score, optimized resume, persona analysis, and 3 cold emails.', icon: Zap },
            ].map((item, i) => (
              <motion.div key={item.step} variants={stagger.item} className="text-center group">
                <div className="relative mx-auto mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto group-hover:border-brand-200 group-hover:bg-brand-50 transition-all">
                    <item.icon className="w-7 h-7 text-gray-400 group-hover:text-brand-600 transition-colors" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger.container} className="text-center mb-16">
            <motion.p variants={stagger.item} className="text-sm font-semibold text-brand-600 mb-3">Features</motion.p>
            <motion.h2 variants={stagger.item} className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Everything you need to land interviews</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger.container} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <motion.div key={f.title} variants={stagger.item} whileHover={{ y: -6 }}
                className="relative rounded-2xl bg-white ring-1 ring-gray-100 p-7 group cursor-default hover:shadow-xl hover:ring-gray-200 transition-all duration-300">
                {f.pro && <span className="absolute top-5 right-5 text-[9px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full ring-1 ring-brand-200">PRO</span>}
                <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 group-hover:bg-brand-50 group-hover:border-brand-200 transition-all">
                  <f.icon className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── METRICS ── */}
      <section className="py-28 px-6 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.04),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger.container} className="text-center mb-20">
            <motion.p variants={stagger.item} className="text-sm font-semibold text-brand-600 mb-3">Results</motion.p>
            <motion.h2 variants={stagger.item} className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Numbers that matter</motion.h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 3.8, suffix: 'x', label: 'More callbacks', desc: 'vs manual applications' },
              { value: 87, suffix: '%', label: 'ATS pass rate', desc: 'after optimization' },
              { value: 42, suffix: '%', label: 'Email reply rate', desc: 'personalized outreach' },
              { value: 60, suffix: 's', label: 'Per application', desc: 'end to end' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 text-center ring-1 ring-gray-100 hover:ring-gray-200 hover:shadow-lg transition-all duration-300">
                <p className="text-4xl md:text-5xl font-bold text-gray-900 mb-1 tabular-nums"><Counter value={s.value} suffix={s.suffix} /></p>
                <p className="text-sm font-medium text-gray-900 mb-0.5">{s.label}</p>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger.container} className="text-center mb-16">
            <motion.p variants={stagger.item} className="text-sm font-semibold text-brand-600 mb-2">Simple, transparent pricing</motion.p>
            <motion.h2 variants={stagger.item} className="text-3xl md:text-4xl font-bold text-gray-900">Start free. Upgrade when you&apos;re ready.</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger.container} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={stagger.item} whileHover={{ y: -4 }}
                className={`relative rounded-2xl p-7 transition-all ${plan.popular ? 'bg-white ring-2 ring-gray-900 shadow-xl' : 'bg-white ring-1 ring-gray-200 hover:shadow-lg'}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-gray-900 px-4 py-1 rounded-full">MOST POPULAR</span>}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                <div className="mb-6"><span className="text-4xl font-bold text-gray-900">{plan.price}</span><span className="text-sm text-gray-400">{plan.period}</span></div>
                <Link href="/sign-up"><Button className={`w-full mb-6 rounded-xl h-11 ${plan.popular ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{plan.cta}</Button></Link>
                <div className="space-y-2.5">
                  {plan.features.map((f) => <div key={f} className="flex items-start gap-2.5"><Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" /><span className="text-sm text-gray-600">{f}</span></div>)}
                  {plan.excluded.map((f) => <div key={f} className="flex items-start gap-2.5"><X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" /><span className="text-sm text-gray-400">{f}</span></div>)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-28 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger.container} className="text-center mb-16">
            <motion.p variants={stagger.item} className="text-sm font-semibold text-brand-600 mb-3">Testimonials</motion.p>
            <motion.h2 variants={stagger.item} className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Loved by job seekers</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger.container} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={stagger.item} whileHover={{ y: -4 }} className="rounded-2xl bg-white ring-1 ring-gray-100 p-6 hover:shadow-xl hover:ring-gray-200 transition-all duration-300">
                <div className="flex gap-0.5 mb-4">{Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">{t.name[0]}</div>
                  <div><p className="text-sm font-semibold text-gray-900">{t.name}</p><p className="text-xs text-gray-400">{t.company}</p></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-3xl bg-gray-950 p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.1),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 tracking-tight">Ready to land your next role?</h2>
            <p className="text-lg text-white/50 mb-8 max-w-lg mx-auto leading-relaxed">Join thousands of professionals who stopped applying blind and started getting responses.</p>
            <Link href="/sign-up"><Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-base px-8 h-12 rounded-xl shadow-2xl shadow-white/10 font-semibold">Get Started Free <ArrowRight className="w-4 h-4" /></Button></Link>
            <p className="text-xs text-white/25 mt-5">No credit card required</p>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-[10px] font-black text-white">R</div>
                <span className="text-base font-bold text-gray-900">ResumeAI</span>
              </div>
              <p className="text-sm text-gray-500">AI-powered job application platform. One platform, five tools, zero friction.</p>
            </div>
            <div><h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4><div className="space-y-2"><a href="#features" className="block text-sm text-gray-500 hover:text-gray-700">Features</a><a href="#pricing" className="block text-sm text-gray-500 hover:text-gray-700">Pricing</a><Link href="/sign-up" className="block text-sm text-gray-500 hover:text-gray-700">Get Started</Link></div></div>
            <div><h4 className="text-sm font-semibold text-gray-900 mb-3">Company</h4><div className="space-y-2"><span className="block text-sm text-gray-500">About</span><span className="block text-sm text-gray-500">Blog</span></div></div>
            <div><h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4><div className="space-y-2"><span className="block text-sm text-gray-500">Privacy</span><span className="block text-sm text-gray-500">Terms</span></div></div>
          </div>
          <div className="border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-400">&copy; 2026 ResumeAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
