'use client';

import { motion } from 'framer-motion';
import { getScoreColor } from './score-gauge';

interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
  animated?: boolean;
}

export function ScoreBar({ label, value, max = 100, animated = true }: ScoreBarProps) {
  const pct = (value / max) * 100;
  const colors = getScoreColor(value);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className={`font-semibold ${colors.text}`}>{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-2 rounded-full"
          style={{ backgroundColor: colors.stroke }}
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
}
