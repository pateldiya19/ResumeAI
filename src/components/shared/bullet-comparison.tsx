'use client';

import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface BulletComparisonProps {
  original: string;
  suggestion: string;
  index?: number;
}

export function BulletComparison({ original, suggestion, index = 0 }: BulletComparisonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="space-y-3"
    >
      {/* Original (weak) */}
      <div className="rounded-xl bg-red-50 ring-1 ring-red-200/50 p-4">
        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5">Original</p>
        <p className="text-sm text-red-700/70 leading-relaxed">{original}</p>
      </div>

      {/* Arrow / sparkle divider */}
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center ring-1 ring-brand-200/50">
          <ArrowDown className="w-4 h-4 text-brand-600" />
        </div>
      </div>

      {/* Suggested (improved) */}
      <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200/50 p-4">
        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Improved</p>
        <p className="text-sm text-emerald-900 font-medium leading-relaxed">{suggestion}</p>
      </div>
    </motion.div>
  );
}
