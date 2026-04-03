'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Mail,
  FolderKanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { PlanBadge } from '@/components/ui/plan-badge';
import { cn } from '@/lib/cn';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Analysis', href: '/analyze', icon: PlusCircle },
  { label: 'History', href: '/history', icon: Clock },
  { label: 'Applications', href: '/applications', icon: Mail },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analyze': 'New Analysis',
  '/history': 'History',
  '/applications': 'Applications',
  '/projects': 'Projects',
  '/settings': 'Settings',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [plan, setPlan] = useState('free');
  const [usage, setUsage] = useState({ analysesUsed: 0, analysesLimit: 3 });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/user/credits')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.plan) setPlan(data.plan);
        if (data?.usage) setUsage(data.usage);
      })
      .catch(() => {});

    fetch('/api/user/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.role === 'admin') setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  const pageTitle = pageTitles[pathname] || (pathname.startsWith('/results') ? 'Results' : 'Dashboard');

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold text-brand-600"
            >
              ResumeAI
            </motion.span>
          )}
          {!sidebarOpen && (
            <span className="text-lg font-bold text-brand-600">R</span>
          )}
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hidden md:flex"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-600 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-gray-100" />
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/admin')
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Shield className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>Admin Panel</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Plan card */}
      {sidebarOpen && (
        <div className="p-3">
          <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 p-4 ring-1 ring-brand-200/30">
            <div className="flex items-center gap-2 mb-2">
              <PlanBadge plan={plan} />
            </div>
            <p className="text-xs text-gray-600 mb-1">
              {usage.analysesUsed}/{usage.analysesLimit === -1 ? '∞' : usage.analysesLimit} analyses
            </p>
            <div className="w-full bg-brand-200/30 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-brand-600 transition-all"
                style={{
                  width: `${usage.analysesLimit === -1 ? 0 : Math.min((usage.analysesUsed / usage.analysesLimit) * 100, 100)}%`,
                }}
              />
            </div>
            {plan === 'free' && (
              <Link
                href="/settings"
                className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Upgrade →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#FAFAF8]">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:flex flex-col bg-white border-r border-gray-100 shrink-0 overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 flex flex-col shadow-xl md:hidden"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 glass border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8 ring-2 ring-brand-100',
                },
              }}
            />
          </div>
        </header>

        {/* Content with page transition */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
