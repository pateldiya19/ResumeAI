'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, AlertTriangle, ArrowUp, ArrowDown, Mail, Activity, CheckCircle, XCircle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

interface AdminStats {
  totalUsers: number; totalAnalyses: number; totalApplications: number; flaggedItems: number;
  recentSignups: number; activeAnalyses: number; completedAnalyses: number; failedAnalyses: number;
  userGrowth: number; analysisGrowth: number;
  planDistribution: Record<string, number>; modeBreakdown: Record<string, number>;
  dailySignups: Array<{ date: string; count: number }>; dailyAnalyses: Array<{ date: string; count: number }>;
}

const DONUT_COLORS = ['#d1d5db', '#3b82f6', '#8b5cf6'];
const MODE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280'];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => (r.ok ? r.json() : null)).then((d) => setStats(d)).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div>;
  if (!stats) return <p className="text-gray-400 py-12 text-center">Failed to load stats.</p>;

  const metrics = [
    { label: 'Total Users', value: (stats.totalUsers ?? 0).toLocaleString(), trend: (stats.userGrowth ?? 0) >= 0 ? 'up' : 'down', trendValue: `${(stats.userGrowth ?? 0) >= 0 ? '+' : ''}${stats.userGrowth ?? 0}%`, helper: `${stats.recentSignups ?? 0} this month`, icon: Users },
    { label: 'Total Analyses', value: (stats.totalAnalyses ?? 0).toLocaleString(), trend: (stats.analysisGrowth ?? 0) >= 0 ? 'up' : 'down', trendValue: `${(stats.analysisGrowth ?? 0) >= 0 ? '+' : ''}${stats.analysisGrowth ?? 0}%`, helper: `${stats.activeAnalyses ?? 0} active`, icon: BarChart3 },
    { label: 'Emails Sent', value: (stats.totalApplications ?? 0).toLocaleString(), trend: 'up', trendValue: 'All time', helper: 'via Resend', icon: Mail },
    { label: 'Flagged Items', value: (stats.flaggedItems ?? 0).toLocaleString(), trend: (stats.flaggedItems ?? 0) > 0 ? 'down' : 'up', trendValue: (stats.flaggedItems ?? 0) > 0 ? 'Needs review' : 'All clear', helper: 'moderation', icon: AlertTriangle },
  ];

  const signupData = (stats.dailySignups ?? []).map((d) => ({ date: d.date.slice(5), users: d.count }));
  const analysisData = (stats.dailyAnalyses ?? []).map((d) => ({ date: d.date.slice(5), analyses: d.count }));
  // Handle planDistribution whether it's {free:N,pro:N} or [{_id:'free',count:N}]
  let planData: Array<{name: string; value: number}> = [];
  if (stats.planDistribution) {
    if (Array.isArray(stats.planDistribution)) {
      planData = (stats.planDistribution as Array<{_id: string; count: number}>).map((d) => ({ name: d._id || 'unknown', value: d.count || 0 }));
    } else {
      planData = Object.entries(stats.planDistribution).map(([name, value]) => ({ name, value: typeof value === 'number' ? value : 0 }));
    }
  }
  const planTotal = planData.reduce((s, d) => s + d.value, 0) || 1;

  let modeData: Array<{name: string; value: number}> = [];
  if (stats.modeBreakdown) {
    if (Array.isArray(stats.modeBreakdown)) {
      modeData = (stats.modeBreakdown as Array<{_id: string; count: number}>).map((d) => ({ name: d._id === 'resume_only' ? 'Resume Check' : d._id === 'job_analysis' ? 'Job Match' : d._id === 'full_application' ? 'Full App' : d._id || 'unknown', value: d.count || 0 }));
    } else {
      modeData = Object.entries(stats.modeBreakdown).map(([name, value]) => ({ name: name === 'resume_only' ? 'Resume Check' : name === 'job_analysis' ? 'Job Match' : name === 'full_application' ? 'Full App' : name, value: typeof value === 'number' ? value : 0 }));
    }
  }
  const successRate = (stats.completedAnalyses ?? 0) + (stats.failedAnalyses ?? 0) > 0 ? Math.round(((stats.completedAnalyses ?? 0) / ((stats.completedAnalyses ?? 0) + (stats.failedAnalyses ?? 0))) * 100) : 100;

  return (
    <div className="space-y-6 max-w-7xl">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          const TrendIcon = m.trend === 'up' ? ArrowUp : ArrowDown;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-medium">{m.label}</p>
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums mb-2">{m.value}</p>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-0.5 text-xs font-medium ${m.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                  <TrendIcon className="w-3 h-3" strokeWidth={2.5} />{m.trendValue}
                </span>
                <span className="text-gray-400 text-[10px]">{m.helper}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signups */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">User Signups (14 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={signupData}>
              <defs><linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#sGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Analyses */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Analyses (14 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analysisData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="analyses" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plan Distribution */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart><Pie data={planData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={2} dataKey="value">
              {planData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
            </Pie></PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {planData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} /><span className="text-xs text-gray-500 capitalize">{d.name}</span></div>
                <span className="text-xs font-semibold text-gray-900">{d.value} ({Math.round((d.value / planTotal) * 100)}%)</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mode Breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Analysis Modes</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={modeData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                {modeData.map((_, i) => <Cell key={i} fill={MODE_COLORS[i % MODE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {modeData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODE_COLORS[i % MODE_COLORS.length] }} /><span className="text-gray-500">{d.name}</span></div>
                <span className="text-gray-900 font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pipeline Health */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Health</h3>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{successRate}%</p>
              <p className="text-xs text-gray-400 mt-1">Success Rate</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 rounded-lg p-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.completedAnalyses ?? 0}</p>
                <p className="text-[10px] text-gray-500">Done</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.failedAnalyses ?? 0}</p>
                <p className="text-[10px] text-gray-500">Failed</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <Activity className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.activeAnalyses ?? 0}</p>
                <p className="text-[10px] text-gray-500">Active</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
