import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Analysis from '@/models/Analysis';
import Project from '@/models/Project';
import CreditTransaction from '@/models/CreditTransaction';
import { AdminUserActionSchema } from '@/lib/utils/validators';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id).select('-password -__v');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [recentAnalyses, projectsCount, totalAnalyses] = await Promise.all([
      Analysis.find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('status scores.overallScore candidate.resumeFileName target.name createdAt updatedAt'),
      Project.countDocuments({ userId: id }),
      Analysis.countDocuments({ userId: id }),
    ]);

    return NextResponse.json({
      user,
      recentAnalyses,
      projectsCount,
      totalAnalyses,
    });
  } catch (error) {
    console.error('GET /api/admin/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json();
    const validation = AdminUserActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { action, reason, plan, credits } = validation.data;

    switch (action) {
      case 'ban': {
        user.isBanned = true;
        user.banReason = reason;
        await user.save();
        break;
      }

      case 'unban': {
        user.isBanned = false;
        user.banReason = undefined;
        await user.save();
        break;
      }

      case 'change_plan': {
        user.plan = plan!;
        await user.save();
        break;
      }

      case 'add_credits': {
        const amount = credits!;
        user.credits += amount;
        await user.save();

        await CreditTransaction.create({
          userId: user._id,
          type: 'bonus',
          amount,
          balance: user.credits,
          description: reason || `Admin added ${amount} credits`,
        });
        break;
      }
    }

    const updatedUser = await User.findById(id).select('-password -__v');
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PATCH /api/admin/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
