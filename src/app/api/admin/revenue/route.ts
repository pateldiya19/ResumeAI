import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Analysis from '@/models/Analysis';
import Application from '@/models/Application';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const [
      planAgg,
      creditsAgg,
      totalApplications,
      applicationsByDay,
      analysesByMode,
    ] = await Promise.all([
      // Plan distribution
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),

      // Total credits in circulation
      User.aggregate([
        { $group: { _id: null, totalCredits: { $sum: '$credits' } } },
      ]),

      // Total applications sent
      Application.countDocuments(),

      // Applications by day (last 14 days)
      Application.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Analyses by mode
      Analysis.aggregate([
        { $group: { _id: '$mode', count: { $sum: 1 } } },
      ]),
    ]);

    // Calculate revenue from plan distribution
    const planPricing: Record<string, number> = { free: 0, pro: 19, enterprise: 49 };
    const planDistribution: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
    let monthlyRevenue = 0;
    for (const e of planAgg) {
      const plan = (e._id as string) || 'free';
      const count = e.count as number;
      if (plan in planDistribution) {
        planDistribution[plan] = count;
        monthlyRevenue += (planPricing[plan] || 0) * count;
      }
    }

    const totalRevenue = monthlyRevenue; // Current MRR
    const creditsInCirculation = creditsAgg[0]?.totalCredits || 0;

    // Top users by analysis count
    const topUsers = await User.aggregate([
      {
        $lookup: {
          from: 'analyses',
          localField: '_id',
          foreignField: 'userId',
          as: 'analyses',
        },
      },
      { $addFields: { analysisCount: { $size: '$analyses' } } },
      { $match: { analysisCount: { $gt: 0 } } },
      { $sort: { analysisCount: -1 } },
      { $limit: 5 },
      { $project: { name: 1, email: 1, plan: 1, analysisCount: 1 } },
    ]);

    return NextResponse.json({
      totalRevenue,
      monthlyRevenue,
      creditsInCirculation,
      totalApplications,
      planDistribution,
      dailyRevenue: applicationsByDay.map((d: { _id: string; count: number }) => ({
        date: d._id,
        amount: d.count,
      })),
      topSpenders: topUsers.map((u: Record<string, unknown>) => ({
        name: u.name || 'User',
        email: u.email || '',
        totalSpent: u.analysisCount || 0,
      })),
    });
  } catch (error) {
    console.error('GET /api/admin/revenue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
