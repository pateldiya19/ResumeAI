import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import ModerationFlag from '@/models/ModerationFlag';
import User from '@/models/User';
import { ModerationActionSchema } from '@/lib/utils/validators';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid flag ID' }, { status: 400 });
    }

    await connectDB();

    const flag = await ModerationFlag.findById(id)
      .populate('targetUserId', 'name email avatar plan isBanned')
      .populate('reviewedBy', 'name email');

    if (!flag) {
      return NextResponse.json({ error: 'Moderation flag not found' }, { status: 404 });
    }

    return NextResponse.json(flag);
  } catch (error) {
    console.error('GET /api/admin/moderation/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid flag ID' }, { status: 400 });
    }

    const body = await req.json();
    const validation = ModerationActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const flag = await ModerationFlag.findById(id);
    if (!flag) {
      return NextResponse.json({ error: 'Moderation flag not found' }, { status: 404 });
    }

    if (flag.status !== 'pending') {
      return NextResponse.json(
        { error: 'This flag has already been reviewed' },
        { status: 400 }
      );
    }

    const { action, note: reviewNote } = validation.data;

    // Map action to status
    const statusMap: Record<string, 'approved' | 'rejected' | 'banned'> = {
      approve: 'approved',
      reject: 'rejected',
      ban: 'banned',
    };

    flag.status = statusMap[action];
    flag.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    flag.reviewedAt = new Date();
    if (reviewNote) {
      flag.reviewNote = reviewNote;
    }
    await flag.save();

    // If action is ban, also ban the target user
    if (action === 'ban') {
      await User.findByIdAndUpdate(flag.targetUserId, {
        isBanned: true,
        banReason: `Banned via moderation flag: ${flag.type} - ${reviewNote || flag.description}`,
      });
    }

    const updatedFlag = await ModerationFlag.findById(id)
      .populate('targetUserId', 'name email avatar plan isBanned')
      .populate('reviewedBy', 'name email');

    return NextResponse.json(updatedFlag);
  } catch (error) {
    console.error('PATCH /api/admin/moderation/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
