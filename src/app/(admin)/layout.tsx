'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Boxes, DollarSign, Shield, LogOut,
  PanelLeftClose, PanelLeft, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const adminNav = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Pipeline', href: '/admin/pipeline', icon: Boxes },
  { label: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { label: 'Moderation', href: '/admin/moderation', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const activeIndex = adminNav.findIndex((item) => pathname === item.href);

  useEffect(() => {
    if (isLoaded && !isSignedIn) { router.push('/sign-in'); return; }
    if (isLoaded && isSignedIn) {
      fetch('/api/user/profile')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.role === 'admin') setIsAdmin(true);
          else { setIsAdmin(false); router.push('/dashboard'); }
        })
        .catch(() => { setIsAdmin(false); router.push('/dashboard'); });
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isAdmin === null) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-neutral-100 p-3 gap-0">
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
        className={cn(
          'flex flex-col shrink-0 rounded-2xl p-2 transition-colors duration-700',
          sidebarOpen ? 'bg-white' : 'bg-transparent'
        )}
      >
        {/* Header */}
        <div className={cn('flex items-center w-full p-2 shrink-0', sidebarOpen ? 'justify-between' : 'justify-center')}>
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-[10px] font-black text-white">R</div>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold text-gray-900">ResumeAI</motion.span>
              <span className="text-[9px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded">ADMIN</span>
            </div>
          )}
          <motion.button layout onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition shrink-0">
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Nav — expanded */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.nav
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col gap-0.5 mt-4 w-full relative z-10"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {adminNav.map((item, index) => {
                const isActive = index === activeIndex;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="relative cursor-pointer" onMouseEnter={() => setHoveredIndex(index)}>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div className="absolute inset-0 z-0 bg-gray-100 rounded-lg" layoutId="admin-nav-active"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {hoveredIndex === index && !isActive && (
                          <motion.span layoutId="admin-nav-hover" className="absolute inset-0 z-0 bg-gray-50 rounded-lg"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
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
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Nav — collapsed (icons only) */}
        {!sidebarOpen && (
          <nav className="flex-1 flex flex-col items-center gap-1 mt-4">
            {adminNav.map((item, index) => {
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

        {/* User section at bottom */}
        <div className="mt-auto p-2">
          {sidebarOpen ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-50 transition text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-blue-400 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                  {user?.imageUrl ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" /> : (user?.firstName?.[0] || 'A')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{user?.fullName || 'Admin'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <LayoutDashboard className="w-4 h-4 text-gray-400" />
                      User Dashboard
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut({ redirectUrl: '/' }); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              title="Sign Out"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition mx-auto"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl ml-3 overflow-hidden">
        <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-base font-semibold text-gray-900">
            {adminNav.find((n) => n.href === pathname)?.label || 'Admin'}
          </h1>
          <span className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">Admin Panel</span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <motion.div key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
