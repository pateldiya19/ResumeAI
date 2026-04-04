'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TIER_COLORS, type BadgeTier } from '@/lib/badges/badge-definitions';
import { cn } from '@/lib/cn';

interface EarnedBadge { id: string; name: string; description: string; icon: string; tier: BadgeTier }
interface LockedBadge { id: string; name: string; hint: string; icon: string; tier: BadgeTier }

export function AchievementBadges() {
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [locked, setLocked] = useState<LockedBadge[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/badges').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setEarned(d.earned || []); setLocked(d.locked || []); setTotal(d.totalAvailable || 0); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading || total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Achievements
          <span className="text-xs font-normal text-gray-400">{earned.length} of {total}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {earned.map((b, i) => {
            const colors = TIER_COLORS[b.tier];
            return (
              <motion.div key={b.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-default ring-1', colors.bg, colors.ring)}
                title={`${b.name}: ${b.description}`}>
                {b.icon}
              </motion.div>
            );
          })}
          {locked.map((b) => (
            <div key={b.id}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-default bg-gray-50 ring-1 ring-gray-200 opacity-30 grayscale relative"
              title={`Locked: ${b.hint}`}>
              {b.icon}
              <Lock className="w-2.5 h-2.5 absolute bottom-0.5 right-0.5 text-gray-400" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
