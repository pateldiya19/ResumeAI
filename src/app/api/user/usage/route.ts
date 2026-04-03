import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Analysis from '@/models/Analysis';

const PLAN_LIMITS = {
  free: { analyses: 3, sends: 5 },
  pro: { analyses: 50, sends: 100 },
  enterprise: { analyses: -1, sends: -1 },
} as const;

const PLAN_FEATURES = {
  free: {
    resumeOptimization: true,
    linkedinScraping: true,
    emailGeneration: true,
    priorityProcessing: false,
    advancedAnalytics: false,
    customBranding: false,
  },
  pro: {
    resumeOptimization: true,
    linkedinScraping: true,
    emailGeneration: true,
    priorityProcessing: true,
    advancedAnalytics: true,
    customBranding: false,
  },
  enterprise: {
    resumeOptimization: true,
    linkedinScraping: true,
    emailGeneration: true,
    priorityProcessing: true,
    advancedAnalytics: true,
    customBranding: true,
  },
} as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select(
      'plan credits monthlyAnalysesUsed monthlyAnalysesReset monthlySendsUsed monthlySendsReset'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    let analysesUsed = user.monthlyAnalysesUsed;
    let sendsUsed = user.monthlySendsUsed;
    let resetsAt = user.monthlyAnalysesReset;

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
    const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;

    // Get total analyses ever
    const totalAnalyses = await Analysis.countDocuments({ userId: session.user.id });
    const completedAnalyses = await Analysis.countDocuments({
      userId: session.user.id,
      status: 'complete',
    });

    return NextResponse.json({
      plan: user.plan,
      credits: user.credits,
      currentPeriod: {
        analysesUsed,
        analysesLimit: limits.analyses,
        sendsUsed,
        sendsLimit: limits.sends,
        resetsAt,
      },
      lifetime: {
        totalAnalyses,
        completedAnalyses,
      },
      features,
    });
  } catch (error) {
    console.error('GET /api/user/usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
