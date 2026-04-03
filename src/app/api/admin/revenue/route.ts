import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import CreditTransaction from '@/models/CreditTransaction';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [dailyRevenue, planDistribution, creditsResult, topSpenders] = await Promise.all([
      // Daily revenue from purchase transactions (last 30 days)
      CreditTransaction.aggregate([
        {
          $match: {
            type: 'purchase',
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: '$_id',
            total: 1,
            count: 1,
            _id: 0,
          },
        },
      ]),

      // Plan distribution
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
        {
          $project: {
            plan: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ]),

      // Total credits in circulation
      User.aggregate([
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$credits' },
          },
        },
      ]),

      // Top spenders (by purchase transactions)
      CreditTransaction.aggregate([
        { $match: { type: 'purchase' } },
        {
          $group: {
            _id: '$userId',
            totalSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            plan: '$user.plan',
            totalSpent: 1,
            transactionCount: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    const creditsInCirculation = creditsResult[0]?.totalCredits || 0;

    return NextResponse.json({
      dailyRevenue,
      planDistribution,
      creditsInCirculation,
      topSpenders,
    });
  } catch (error) {
    console.error('GET /api/admin/revenue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
