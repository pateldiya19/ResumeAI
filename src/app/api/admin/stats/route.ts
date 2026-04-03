import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Analysis from '@/models/Analysis';
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
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalAnalyses,
      totalFlags,
      recentUsers,
      previousUsers,
      recentAnalyses,
      previousAnalyses,
    ] = await Promise.all([
      User.countDocuments(),
      Analysis.countDocuments(),
      ModerationFlag.countDocuments({ status: 'pending' }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      Analysis.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Analysis.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
    ]);

    // Calculate growth percentages
    const userGrowth =
      previousUsers > 0
        ? ((recentUsers - previousUsers) / previousUsers) * 100
        : recentUsers > 0
          ? 100
          : 0;

    const analysisGrowth =
      previousAnalyses > 0
        ? ((recentAnalyses - previousAnalyses) / previousAnalyses) * 100
        : recentAnalyses > 0
          ? 100
          : 0;

    return NextResponse.json({
      totalUsers,
      totalAnalyses,
      totalRevenue: 0,
      totalFlags,
      userGrowth: Math.round(userGrowth),
      analysisGrowth: Math.round(analysisGrowth),
      revenueGrowth: 0,
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
