'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Upload,
  Target,
  Send,
  FileText,
  Brain,
  BarChart3,
  Mail,
  Rocket,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Star,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── Animated counter ─── */
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v * 10) / 10),
    });
    return controls.stop;
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/* ─── Stagger helpers ─── */
const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
  item: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  },
};

/* ─── Features data ─── */
const features = [
  { title: 'Resume Parsing', desc: 'Upload PDF or DOCX. We extract and structure your experience, skills, and education automatically.', icon: FileText },
  { title: 'Recruiter Intel', desc: 'Scrape any recruiter\'s LinkedIn for persona analysis, communication style, and hiring priorities.', icon: Target },
  { title: 'AI Resume Rewriter', desc: 'Every bullet point rewritten with stronger verbs, quantified impact, and JD-aligned keywords.', icon: Brain },
  { title: 'ATS Scoring', desc: 'Get a 0-100 ATS score with detailed breakdown: keyword match, formatting, structure, parsability.', icon: BarChart3 },
  { title: 'Cold Email Gen', desc: '3 personalized email variants per recruiter — professional, conversational, and mutual connection.', icon: Mail },
  { title: 'One-Click Send', desc: 'Send your cold email directly from the platform. No copy-paste, no switching tabs.', icon: Rocket, pro: true },
];

/* ─── Pricing data ─── */
const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Get started with basic analysis',
    features: ['3 analyses/month', 'ATS & Job-Fit scoring', 'Resume download', 'Email copy to clipboard'],
    excluded: ['One-click email send', 'Full recruiter persona', 'Auto JD generation', 'Project portfolio in resume'],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    desc: 'Everything you need to land interviews',
    features: ['Unlimited analyses', '10 email sends/month', 'Full recruiter persona', 'Auto JD generation', 'Project portfolio in resume', 'Delivery tracking'],
    excluded: ['Batch mode', 'Team seats'],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    desc: 'For power users and teams',
    features: ['Everything in Pro', 'Unlimited sends', 'Batch mode', 'Team seats', 'Priority scraping', 'API access'],
    excluded: [],
    cta: 'Contact Us',
    popular: false,
  },
];

/* ─── Testimonials ─── */
const testimonials = [
  { name: 'Priya M.', role: 'Software Engineer', quote: 'Went from 0 callbacks to 4 interviews in 2 weeks. The recruiter persona feature is a game-changer.', stars: 5 },
  { name: 'Alex K.', role: 'Product Manager', quote: 'The AI-rewritten bullets were so much better than what I had. My ATS score jumped from 52 to 89.', stars: 5 },
  { name: 'Sarah L.', role: 'Data Scientist', quote: 'One-click send saved me hours. I sent 10 personalized cold emails in the time it takes to write one.', stars: 5 },
];

/* ─── Main Component ─── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* ── NAVBAR ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass border-b border-gray-200/50 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="text-xl font-bold text-brand-600">
            ResumeAI
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Features</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Testimonials</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden glass border-t border-gray-200/50 px-6 py-4 space-y-3"
          >
            <a href="#features" className="block text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="block text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <div className="flex gap-2 pt-2">
              <Link href="/sign-in" className="flex-1"><Button variant="outline" className="w-full" size="sm">Log In</Button></Link>
              <Link href="/sign-up" className="flex-1"><Button className="w-full" size="sm">Get Started</Button></Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 ring-1 ring-brand-200/50 mb-8"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-xs font-semibold text-brand-700">AI-Powered Resume Platform</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08] mb-6"
            >
              Land Your Dream Job{' '}
              <br className="hidden md:block" />
              with an{' '}
              <span className="font-display italic bg-gradient-to-r from-brand-600 to-blue-500 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Resume
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10"
            >
              Paste a recruiter&apos;s LinkedIn. We analyze who they are, build a resume they&apos;ll love,
              and craft a personalized cold email — all in one click.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/sign-up">
                <Button size="lg" variant="gradient" className="text-base px-8 shadow-lg shadow-brand-500/25">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-base">
                  See How It Works
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Floating demo card */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-2xl shadow-brand-500/10 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-gray-400 font-medium">ResumeAI — Analysis Results</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'ATS Score', value: 87, color: '#10B981' },
                  { label: 'Job Fit', value: 92, color: '#3B82F6' },
                  { label: 'Consistency', value: 81, color: '#6C3AED' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                    <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-brand-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-brand-600 font-semibold mb-0.5">Recruiter Persona</p>
                  <p className="text-xs text-gray-500">Sarah Chen · VP Eng @ Google · Casual communicator</p>
                </div>
                <Button size="sm" className="shrink-0">
                  <Send className="w-3.5 h-3.5" />
                  Send Email
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="py-10 border-y border-gray-100 overflow-hidden">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Trusted by job seekers at
        </p>
        <div className="relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center gap-16 mx-8">
                {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Stripe', 'Figma'].map((name) => (
                  <span key={`${setIdx}-${name}`} className="text-lg font-bold text-gray-300 select-none">{name}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger.container}
            className="text-center mb-16"
          >
            <motion.p variants={stagger.item} className="text-sm font-semibold text-brand-600 mb-2">
              Simple 3-step process
            </motion.p>
            <motion.h2 variants={stagger.item} className="text-3xl md:text-4xl font-bold text-gray-900">
              How It Works
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger.container}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
          >
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px border-t-2 border-dashed border-brand-200" />

            {[
              { step: '01', title: 'Upload Resume', desc: 'Upload your PDF or DOCX resume and optionally your LinkedIn URL.', icon: Upload },
              { step: '02', title: 'Target a Recruiter', desc: 'Paste the LinkedIn URL of the recruiter or hiring manager you want to reach.', icon: Target },
              { step: '03', title: 'Get Results', desc: 'AI scores your resume, rewrites bullets, builds a persona, and generates emails.', icon: Sparkles },
            ].map((item) => (
              <motion.div key={item.step} variants={stagger.item} className="relative text-center">
                <div className="w-24 h-24 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5 ring-4 ring-white relative z-10">
                  <item.icon className="w-10 h-10 text-brand-600" />
                </div>
                <span className="text-xs font-bold text-brand-400 mb-2 block">STEP {item.step}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger.container}
            className="text-center mb-16"
          >
            <motion.p variants={stagger.item} className="text-sm font-semibold text-brand-600 mb-2">
              Powerful features
            </motion.p>
            <motion.h2 variants={stagger.item} className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything You Need to Land Interviews
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger.container}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={stagger.item}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative rounded-2xl bg-[#FAFAF8] ring-1 ring-black/5 p-7 group cursor-default hover:shadow-lg transition-shadow"
              >
                {f.pro && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full ring-1 ring-brand-200">
                    PRO
                  </span>
                )}
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  <f.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── DARK METRICS ── */}
      <section className="py-24 px-6 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(108,58,237,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />

        <div className="relative max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
          >
            Measurable Impact on Your Job Search
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 3.8, suffix: '×', label: 'More Callbacks' },
              { value: 87, suffix: '%', label: 'ATS Pass Rate' },
              { value: 42, suffix: '%', label: 'Reply Rate' },
              { value: 5, suffix: 'min', label: 'Per Application' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger.container}
            className="text-center mb-16"
          >
            <motion.p variants={stagger.item} className="text-sm font-semibold text-brand-600 mb-2">
              Simple pricing
            </motion.p>
            <motion.h2 variants={stagger.item} className="text-3xl md:text-4xl font-bold text-gray-900">
              Choose Your Plan
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger.container}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={stagger.item}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl p-7 transition-shadow ${
                  plan.popular
                    ? 'bg-white ring-2 ring-brand-600 shadow-xl shadow-brand-500/10'
                    : 'bg-white ring-1 ring-black/5 hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-brand-600 px-4 py-1 rounded-full">
                    POPULAR
                  </span>
                )}

                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 font-display">{plan.price}</span>
                  <span className="text-sm text-gray-400">{plan.period}</span>
                </div>

                <Link href="/sign-up">
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full mb-6"
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <div className="space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </div>
                  ))}
                  {plan.excluded.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-400">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger.container}
            className="text-center mb-16"
          >
            <motion.p variants={stagger.item} className="text-sm font-semibold text-brand-600 mb-2">
              Wall of love
            </motion.p>
            <motion.h2 variants={stagger.item} className="text-3xl md:text-4xl font-bold text-gray-900">
              What Our Users Say
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger.container}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={stagger.item}
                className="rounded-2xl bg-[#FAFAF8] ring-1 ring-black/5 p-7"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-700">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-brand-600 to-blue-600 p-12 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of job seekers who are landing more interviews with AI-powered resumes.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-gray-50 text-base px-8 shadow-xl">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-white/50 mt-4">No credit card required</p>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <span className="text-lg font-bold text-brand-600">ResumeAI</span>
              <p className="text-sm text-gray-500 mt-2">
                AI-powered job application platform. One platform. Five tools. Zero friction.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-gray-500 hover:text-gray-700">Features</a>
                <a href="#pricing" className="block text-sm text-gray-500 hover:text-gray-700">Pricing</a>
                <Link href="/sign-up" className="block text-sm text-gray-500 hover:text-gray-700">Get Started</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Company</h4>
              <div className="space-y-2">
                <span className="block text-sm text-gray-500">About</span>
                <span className="block text-sm text-gray-500">Blog</span>
                <span className="block text-sm text-gray-500">Careers</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
              <div className="space-y-2">
                <span className="block text-sm text-gray-500">Privacy</span>
                <span className="block text-sm text-gray-500">Terms</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-400">&copy; 2026 ResumeAI. All rights reserved. Built by Team RapidGrowthAI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
