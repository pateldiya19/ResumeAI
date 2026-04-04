'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, CreditCard, ArrowUp, Mail, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface RevenueData {
  totalRevenue?: number;
  monthlyRevenue?: number;
  creditsInCirculation?: number;
  totalApplications?: number;
  planDistribution?: Record<string, number>;
  dailyRevenue?: Array<{ date: string; amount: number }>;
  topSpenders?: Array<{ name: string; email: string; totalSpent: number }>;
}

const PIE_COLORS = ['#d1d5db', '#3b82f6', '#8b5cf6'];

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/revenue').then((r) => (r.ok ? r.json() : null)).then((d) => setData(d)).catch(() => setData(null)).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" /></div>;
  if (!data) return <p className="text-gray-400 py-12 text-center">Failed to load revenue data.</p>;

  const kpis = [
    { label: 'Monthly Revenue (MRR)', value: `$${(data.monthlyRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Total Emails Sent', value: (data.totalApplications ?? 0).toLocaleString(), icon: Mail, color: 'text-blue-600' },
    { label: 'Credits in Circulation', value: (data.creditsInCirculation ?? 0).toLocaleString(), icon: CreditCard, color: 'text-brand-600' },
  ];

  // Plan distribution — handle both array and object
  let pieData: Array<{ name: string; value: number }> = [];
  if (data.planDistribution) {
    if (typeof data.planDistribution === 'object' && !Array.isArray(data.planDistribution)) {
      pieData = Object.entries(data.planDistribution).map(([name, value]) => ({
        name, value: typeof value === 'number' ? value : 0,
      }));
    }
  }
  const totalUsers = pieData.reduce((a, b) => a + b.value, 0) || 1;

  // Daily activity
  const dailyData = Array.isArray(data.dailyRevenue) && data.dailyRevenue.length > 0
    ? data.dailyRevenue.map((d) => ({ name: String(d.date || '').slice(5), count: Number(d.amount || 0) }))
    : [];

  // Top users
  const topSpenders = Array.isArray(data.topSpenders) ? data.topSpenders : [];

  // Revenue breakdown by plan
  const planPricing: Record<string, number> = { free: 0, pro: 19, enterprise: 49 };
  const revenueByPlan = pieData.map((p) => ({
    name: p.name,
    users: p.value,
    revenue: (planPricing[p.name] || 0) * p.value,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
                <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Plan */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
          {revenueByPlan.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueByPlan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, textTransform: 'capitalize' } as object} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number, name: string) => [name === 'revenue' ? `$${v}` : v, name === 'revenue' ? 'MRR' : 'Users']} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">No plan data yet</p>
          )}
          <div className="mt-4 space-y-2">
            {revenueByPlan.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-500 capitalize">{p.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">{p.users} users</span>
                  <span className="font-semibold text-gray-900">${p.revenue}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Plan Distribution Donut */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Plan Distribution</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm text-gray-500 capitalize">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value} ({Math.round((item.value / totalUsers) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">No data yet</p>
          )}
        </motion.div>
      </div>

      {/* Daily Activity */}
      {dailyData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily Email Activity (14 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Top Users by Activity */}
      {topSpenders.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Most Active Users</h3>
          <div className="space-y-3">
            {topSpenders.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-600">{i + 1}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{String(s.name)}</p>
                    <p className="text-xs text-gray-400">{String(s.email)}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-brand-600">{Number(s.totalSpent)} analyses</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
