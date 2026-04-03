import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Analysis from '@/models/Analysis';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const activeStatuses = [
      'pending',
      'scraping_candidate',
      'scraping_target',
      'parsing_jd',
      'analyzing',
      'generating',
    ];

    const [statusBreakdown, activeAnalyses, avgProcessingTimeResult, recentFailures] =
      await Promise.all([
        // Status breakdown
        Analysis.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Count of active (in-progress) analyses
        Analysis.countDocuments({ status: { $in: activeStatuses } }),

        // Average processing time for completed analyses (last 30 days)
        Analysis.aggregate([
          {
            $match: {
              status: 'complete',
              createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $project: {
              processingTime: {
                $subtract: ['$updatedAt', '$createdAt'],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgTime: { $avg: '$processingTime' },
              minTime: { $min: '$processingTime' },
              maxTime: { $max: '$processingTime' },
            },
          },
        ]),

        // Recent failures (last 10)
        Analysis.find({ status: 'failed' })
          .sort({ updatedAt: -1 })
          .limit(10)
          .select('userId errorMessage candidate.resumeFileName target.name createdAt updatedAt')
          .populate('userId', 'name email'),
      ]);

    // Format status breakdown into an object
    const statusMap: Record<string, number> = {};
    for (const item of statusBreakdown) {
      statusMap[item._id] = item.count;
    }

    const avgStats = avgProcessingTimeResult[0] || {
      avgTime: 0,
      minTime: 0,
      maxTime: 0,
    };

    return NextResponse.json({
      activeAnalyses,
      statusBreakdown: statusMap,
      avgProcessingTime: {
        avgMs: Math.round(avgStats.avgTime || 0),
        minMs: Math.round(avgStats.minTime || 0),
        maxMs: Math.round(avgStats.maxTime || 0),
        avgSeconds: Math.round((avgStats.avgTime || 0) / 1000),
      },
      recentFailures,
    });
  } catch (error) {
    console.error('GET /api/admin/pipeline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
