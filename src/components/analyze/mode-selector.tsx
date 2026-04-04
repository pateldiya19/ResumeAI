'use client';

import { motion } from 'framer-motion';
import { FileCheck, Target, Rocket } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AnalysisMode } from '@/types/analysis';

interface ModeSelectorProps {
  selectedMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
}

const modes = [
  {
    key: 'resume_only' as AnalysisMode,
    icon: FileCheck,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    ringColor: 'ring-blue-500/40',
    glowColor: 'shadow-blue-500/15',
    title: 'Resume Check',
    subtitle: 'Is my resume good?',
    tag: 'Fast · No job needed',
  },
  {
    key: 'job_analysis' as AnalysisMode,
    icon: Target,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    ringColor: 'ring-purple-500/40',
    glowColor: 'shadow-purple-500/15',
    title: 'Job Match Analysis',
    subtitle: 'Am I fit for this job?',
    tag: 'Resume + Job Description',
  },
  {
    key: 'full_application' as AnalysisMode,
    icon: Rocket,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    ringColor: 'ring-cyan-500/40',
    glowColor: 'shadow-cyan-500/15',
    title: 'Full AI Application',
    subtitle: 'Apply automatically',
    tag: 'Everything included',
  },
];

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {modes.map((mode) => {
        const isSelected = selectedMode === mode.key;
        const Icon = mode.icon;

        return (
          <motion.button
            key={mode.key}
            onClick={() => onModeChange(mode.key)}
            whileHover={{ scale: isSelected ? 1.02 : 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative rounded-2xl p-5 text-left transition-all duration-300 cursor-pointer',
              'ring-1 hover:ring-2',
              isSelected
                ? cn(
                    'bg-white ring-2',
                    mode.ringColor,
                    `shadow-lg ${mode.glowColor}`,
                    'opacity-100'
                  )
                : 'bg-white ring-gray-200/80 opacity-70 hover:opacity-90 hover:ring-gray-300'
            )}
          >
            {/* Icon */}
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', mode.bgColor)}>
              <motion.div
                key={`${mode.key}-${isSelected}`}
                initial={isSelected ? { scale: 0.8 } : false}
                animate={isSelected ? { scale: [0.8, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Icon className={cn('w-5 h-5', mode.color)} />
              </motion.div>
            </div>

            {/* Content */}
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{mode.title}</h3>
            <p className="text-xs text-gray-500 mb-2">{mode.subtitle}</p>

            {/* Tag */}
            <span className={cn(
              'inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full',
              isSelected
                ? cn(mode.bgColor, mode.color)
                : 'bg-gray-100 text-gray-400'
            )}>
              {mode.tag}
            </span>

            {/* Selected indicator dot */}
            {isSelected && (
              <motion.div
                layoutId="mode-indicator"
                className={cn('absolute top-3 right-3 w-2.5 h-2.5 rounded-full', mode.color.replace('text-', 'bg-'))}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
