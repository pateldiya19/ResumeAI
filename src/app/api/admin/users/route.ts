import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';
    const role = searchParams.get('role') || '';
    const sort = searchParams.get('sort') || 'createdAt_desc';

    await connectDB();

    // Build match filter
    const matchFilter: Record<string, unknown> = {};

    if (search) {
      matchFilter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    if (plan && ['free', 'pro', 'enterprise'].includes(plan)) {
      matchFilter.plan = plan;
    }

    if (role && ['user', 'admin'].includes(role)) {
      matchFilter.role = role;
    }

    // Build sort object
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      createdAt_desc: { createdAt: -1 },
      createdAt_asc: { createdAt: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      email_asc: { email: 1 },
      email_desc: { email: -1 },
    };
    const sortObj = sortMap[sort] || sortMap.createdAt_desc;

    const skip = (page - 1) * limit;

    const [results] = await User.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          users: [
            { $sort: sortObj },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'analyses',
                localField: '_id',
                foreignField: 'userId',
                as: 'analyses',
              },
            },
            {
              $addFields: {
                analysisCount: { $size: '$analyses' },
              },
            },
            {
              $project: {
                analyses: 0,
                __v: 0,
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const total = results.total[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: results.users,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
