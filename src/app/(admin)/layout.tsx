'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Boxes, DollarSign, Shield, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';

const adminNav = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Pipeline', href: '/admin/pipeline', icon: Boxes },
  { label: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { label: 'Moderation', href: '/admin/moderation', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (isLoaded && isSignedIn) {
      fetch('/api/user/profile')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            router.push('/dashboard');
          }
        })
        .catch(() => {
          setIsAdmin(false);
          router.push('/dashboard');
        });
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900/50 border-r border-gray-800/50 flex flex-col shrink-0 backdrop-blur-sm">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-800/50">
          <span className="text-lg font-bold text-white">ResumeAI</span>
          <span className="text-[10px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-3">
          {adminNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative',
                  isActive
                    ? 'bg-brand-600/10 text-brand-400'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-500 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto text-white">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
