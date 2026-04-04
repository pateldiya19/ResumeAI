import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Analysis from '@/models/Analysis';
import Application from '@/models/Application';
import ModerationFlag from '@/models/ModerationFlag';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const activeStatuses = ['pending', 'scraping_candidate', 'scraping_target', 'parsing_jd', 'analyzing', 'generating'];

    const [
      totalUsers,
      totalAnalyses,
      totalApplications,
      flaggedItems,
      recentSignups,
      previousSignups,
      recentAnalyses,
      previousAnalyses,
      activeAnalyses,
      completedAnalyses,
      failedAnalyses,
      planAgg,
      dailySignupsAgg,
      dailyAnalysesAgg,
      modeAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Analysis.countDocuments(),
      Application.countDocuments(),
      ModerationFlag.countDocuments({ status: 'pending' }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      Analysis.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Analysis.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      Analysis.countDocuments({ status: { $in: activeStatuses } }),
      Analysis.countDocuments({ status: 'complete' }),
      Analysis.countDocuments({ status: 'failed' }),
      User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
      // Daily signups last 14 days
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Daily analyses last 14 days
      Analysis.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Analysis mode breakdown
      Analysis.aggregate([{ $group: { _id: '$mode', count: { $sum: 1 } } }]),
    ]);

    const userGrowth = previousSignups > 0 ? Math.round(((recentSignups - previousSignups) / previousSignups) * 100) : recentSignups > 0 ? 100 : 0;
    const analysisGrowth = previousAnalyses > 0 ? Math.round(((recentAnalyses - previousAnalyses) / previousAnalyses) * 100) : recentAnalyses > 0 ? 100 : 0;

    const planDistribution: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
    for (const e of planAgg) { if (e._id in planDistribution) planDistribution[e._id as string] = e.count; }

    const modeBreakdown: Record<string, number> = {};
    for (const e of modeAgg) { modeBreakdown[e._id as string || 'unknown'] = e.count; }

    return NextResponse.json({
      totalUsers,
      totalAnalyses,
      totalApplications,
      flaggedItems,
      recentSignups,
      activeAnalyses,
      completedAnalyses,
      failedAnalyses,
      userGrowth,
      analysisGrowth,
      planDistribution,
      modeBreakdown,
      dailySignups: dailySignupsAgg.map((d: { _id: string; count: number }) => ({ date: d._id, count: d.count })),
      dailyAnalyses: dailyAnalysesAgg.map((d: { _id: string; count: number }) => ({ date: d._id, count: d.count })),
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
