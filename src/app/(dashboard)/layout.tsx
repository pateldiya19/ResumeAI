'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageCircle, Search, Clock, Mail, FolderKanban, Settings,
  Menu, X, Shield, PanelLeftClose, PanelLeft, Plus, PenLine,
} from 'lucide-react';
import { PlanBadge } from '@/components/ui/plan-badge';
import { cn } from '@/lib/cn';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Coach', href: '/chat', icon: MessageCircle },
  { label: 'Analyze', href: '/analyze', icon: Search },
  { label: 'Resume Editor', href: '/editor', icon: PenLine },
  { label: 'History', href: '/history', icon: Clock },
  { label: 'Applications', href: '/applications', icon: Mail },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard', '/chat': 'AI Coach', '/analyze': 'Analyze',
  '/analyze/resume-check': 'Resume Check', '/analyze/job-match': 'Job Match',
  '/analyze/full-application': 'Full Application', '/onboarding': 'Welcome',
  '/history': 'History', '/applications': 'Applications', '/projects': 'Projects',
  '/settings': 'Settings',
  '/editor': 'Resume Editor',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [plan, setPlan] = useState('free');
  const [usage, setUsage] = useState({ analysesUsed: 0, analysesLimit: 3 });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/user/credits').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.plan) setPlan(d.plan); if (d?.usage) setUsage(d.usage); }).catch(() => {});
    fetch('/api/user/profile').then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.role === 'admin') {
        setIsAdmin(true);
        // Auto-redirect admins to admin panel when they land on dashboard
        if (pathname === '/dashboard') {
          router.push('/admin');
        }
      }
    }).catch(() => {});
  }, [pathname]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="w-10 h-10 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
    </div>
  );
  if (!isSignedIn) return null;

  const pageTitle = pageTitles[pathname] || (pathname.startsWith('/results') ? 'Results' : 'Dashboard');

  const activeIndex = navItems.findIndex((item) => pathname === item.href || pathname.startsWith(item.href + '/'));

  return (
    <div className="min-h-screen flex bg-neutral-200/60 p-3 gap-0">
      {/* ── macOS-style Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
        className={cn(
          'hidden md:flex flex-col shrink-0 rounded-2xl p-2 transition-colors duration-700 ease-out',
          sidebarOpen ? 'bg-white' : 'bg-transparent'
        )}
      >
        {/* Header: toggle + new */}
        <div className={cn('flex items-center w-full p-2 shrink-0 text-gray-500', sidebarOpen ? 'justify-between' : 'justify-center')}>
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-[10px] font-black text-white">R</div>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold text-gray-900">ResumeAI</motion.span>
            </Link>
          )}
          <div className="flex items-center gap-1">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
                  <Link href="/analyze" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                    <Plus className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button layout onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition shrink-0">
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* Nav items with macOS hover effect */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.nav
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 flex flex-col gap-0.5 mt-4 w-full relative z-10"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {navItems.map((item, index) => {
                const isActive = index === activeIndex;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className="relative cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(index)}
                    >
                      {/* Active background */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 z-0 bg-gray-100 rounded-lg"
                            layoutId="sidebar-active-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>

                      {/* Hover background */}
                      <AnimatePresence>
                        {hoveredIndex === index && !isActive && (
                          <motion.span
                            layoutId="sidebar-hover-bg"
                            className="absolute inset-0 z-0 bg-gray-50 rounded-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>

                      <div className={cn(
                        'relative z-10 flex items-center gap-3 px-3 py-2.5 text-sm tracking-tight',
                        isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                      )}>
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {isAdmin && (
                <>
                  <div className="my-2 border-t border-gray-100" />
                  <Link href="/admin">
                    <div className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                      pathname.startsWith('/admin') ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
                    )}>
                      <Shield className="w-[18px] h-[18px] shrink-0" />
                      <span>Admin Panel</span>
                    </div>
                  </Link>
                </>
              )}
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Collapsed nav (icons only) */}
        {!sidebarOpen && (
          <nav className="flex-1 flex flex-col items-center gap-1 mt-4">
            {navItems.map((item, index) => {
              const isActive = index === activeIndex;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} title={item.label}>
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                    isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  )}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Plan card */}
        {sidebarOpen && (
          <div className="p-2 mt-auto">
            <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 p-3 ring-1 ring-brand-200/30">
              <div className="flex items-center gap-2 mb-1.5"><PlanBadge plan={plan} /></div>
              <p className="text-xs text-gray-600 mb-1">{usage.analysesUsed}/{usage.analysesLimit === -1 ? '\u221e' : usage.analysesLimit} analyses</p>
              <div className="w-full bg-brand-200/30 rounded-full h-1">
                <div className="h-1 rounded-full bg-brand-600 transition-all" style={{ width: `${usage.analysesLimit === -1 ? 0 : Math.min((usage.analysesUsed / Math.max(usage.analysesLimit, 1)) * 100, 100)}%` }} />
              </div>
              {plan === 'free' && <Link href="/settings" className="mt-1.5 inline-block text-[10px] font-semibold text-brand-600 hover:text-brand-700">Upgrade →</Link>}
            </div>
          </div>
        )}
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 flex flex-col shadow-xl md:hidden p-2">
              <div className="flex items-center justify-between p-3">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-[10px] font-black text-white">R</div>
                  <span className="text-sm font-bold text-gray-900">ResumeAI</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <nav className="flex-1 flex flex-col gap-0.5 mt-2 px-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm', isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50')}>
                      <Icon className="w-[18px] h-[18px] shrink-0" /><span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl ml-3 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 md:hidden"><Menu className="w-5 h-5 text-gray-500" /></button>
            <h1 className="text-base font-semibold text-gray-900">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} />
            <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8 ring-2 ring-gray-100' } }} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
