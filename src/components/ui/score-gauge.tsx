'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600' };
  if (score >= 60) return { stroke: '#3B82F6', bg: 'bg-blue-50', text: 'text-blue-600' };
  if (score >= 40) return { stroke: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-600' };
  return { stroke: '#EF4444', bg: 'bg-red-50', text: 'text-red-600' };
}

const sizes = {
  sm: { size: 64, strokeWidth: 5, fontSize: 'text-sm', labelSize: 'text-[10px]' },
  md: { size: 120, strokeWidth: 7, fontSize: 'text-2xl', labelSize: 'text-xs' },
  lg: { size: 180, strokeWidth: 9, fontSize: 'text-4xl', labelSize: 'text-sm' },
};

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  animated?: boolean;
}

export function ScoreGauge({ score, size = 'md', label, animated = true }: ScoreGaugeProps) {
  const config = sizes[size];
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const colors = getScoreColor(score);

  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(animated ? 0 : score);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(score);
      return;
    }
    const controls = animate(motionValue, score, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return controls.stop;
  }, [score, animated, motionValue]);

  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          viewBox={`0 0 ${config.size} ${config.size}`}
          className="-rotate-90"
        >
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={config.strokeWidth}
          />
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: animated ? 1.5 : 0, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${config.fontSize} ${colors.text}`}>
            {displayValue}
          </span>
          {size !== 'sm' && (
            <span className={`${config.labelSize} text-gray-400`}>/100</span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-gray-500">{label}</span>
      )}
    </div>
  );
}

export { getScoreColor };
