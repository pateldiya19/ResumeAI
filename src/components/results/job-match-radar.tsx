'use client';

import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RadarScores {
  technical_skills: number;
  experience_level: number;
  industry_match: number;
  keyword_coverage: number;
  education_fit: number;
  soft_skills: number;
}

interface JobMatchRadarProps {
  scores: RadarScores;
}

export function JobMatchRadar({ scores }: JobMatchRadarProps) {
  const data = [
    { axis: 'Technical Skills', score: scores.technical_skills },
    { axis: 'Experience', score: scores.experience_level },
    { axis: 'Industry', score: scores.industry_match },
    { axis: 'Keywords', score: scores.keyword_coverage },
    { axis: 'Education', score: scores.education_fit },
    { axis: 'Soft Skills', score: scores.soft_skills },
  ];

  const avg = Math.round(
    data.reduce((sum, d) => sum + d.score, 0) / data.length
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>Resume vs Job Fit Radar</span>
            <span className="text-sm font-normal text-gray-500">Avg: {avg}/100</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#e5e7eb" strokeWidth={0.5} />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  tickCount={5}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#7C3AED"
                  fill="#7C3AED"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {data.map((d) => (
              <div key={d.axis} className="text-center">
                <p className="text-lg font-bold text-gray-900">{d.score}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{d.axis}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
