import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import ModerationFlag from '@/models/ModerationFlag';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const validStatuses = ['pending', 'approved', 'rejected', 'banned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    await connectDB();

    const skip = (page - 1) * limit;

    const [flags, total] = await Promise.all([
      ModerationFlag.find({ status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('targetUserId', 'name email avatar plan')
        .populate('reviewedBy', 'name email'),
      ModerationFlag.countDocuments({ status }),
    ]);

    return NextResponse.json({
      flags,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/admin/moderation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
