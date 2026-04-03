import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

const PLAN_LIMITS = {
  free: { analyses: 3, sends: 5 },
  pro: { analyses: 50, sends: 100 },
  enterprise: { analyses: -1, sends: -1 }, // unlimited
} as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select(
      'credits plan monthlyAnalysesUsed monthlyAnalysesReset monthlySendsUsed monthlySendsReset'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    let analysesUsed = user.monthlyAnalysesUsed;
    let sendsUsed = user.monthlySendsUsed;
    let resetsAt = user.monthlyAnalysesReset;

    // Auto-reset if past the reset date
    if (now >= user.monthlyAnalysesReset) {
      analysesUsed = 0;
      sendsUsed = 0;
      resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await User.findByIdAndUpdate(user._id, {
        monthlyAnalysesUsed: 0,
        monthlySendsUsed: 0,
        monthlyAnalysesReset: resetsAt,
        monthlySendsReset: resetsAt,
      });
    }

    const plan = user.plan as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    return NextResponse.json({
      credits: user.credits,
      plan: user.plan,
      analysesUsed,
      analysesLimit: limits.analyses,
      sendsUsed,
      sendsLimit: limits.sends,
      resetsAt,
    });
  } catch (error) {
    console.error('GET /api/user/credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
