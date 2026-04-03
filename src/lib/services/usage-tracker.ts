import { connectDB } from '@/lib/db';
import User, { IUser } from '@/models/User';

const PLAN_LIMITS = {
  free: {
    monthlyAnalyses: 3,
    monthlySends: 0,
    features: ['basic_scoring', 'resume_download', 'email_copy'],
  },
  pro: {
    monthlyAnalyses: -1,
    monthlySends: 10,
    features: [
      'basic_scoring',
      'resume_download',
      'email_copy',
      'full_persona',
      'auto_jd',
      'one_click_send',
      'delivery_tracking',
      'project_portfolio',
    ],
  },
  enterprise: {
    monthlyAnalyses: -1,
    monthlySends: -1,
    features: [
      'basic_scoring',
      'resume_download',
      'email_copy',
      'full_persona',
      'auto_jd',
      'one_click_send',
      'delivery_tracking',
      'project_portfolio',
      'batch_mode',
      'team_seats',
      'priority_scraping',
    ],
  },
} as const;

type PlanName = keyof typeof PLAN_LIMITS;

interface LimitCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt: Date;
}

function shouldResetCounter(resetDate: Date): boolean {
  const now = new Date();
  return now >= resetDate;
}

function getNextResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

export async function checkAnalysisLimit(userId: string): Promise<LimitCheckResult> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const plan = (user.plan || 'free') as PlanName;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  // Check if monthly counter needs resetting
  if (shouldResetCounter(user.monthlyAnalysesReset)) {
    user.monthlyAnalysesUsed = 0;
    user.monthlyAnalysesReset = getNextResetDate();
    await user.save();
  }

  const limit = limits.monthlyAnalyses;
  const used = user.monthlyAnalysesUsed;
  const allowed = limit === -1 || used < limit;

  return {
    allowed,
    used,
    limit,
    resetsAt: user.monthlyAnalysesReset,
  };
}

export async function checkSendLimit(userId: string): Promise<LimitCheckResult> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const plan = (user.plan || 'free') as PlanName;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  // Check if monthly counter needs resetting
  if (shouldResetCounter(user.monthlySendsReset)) {
    user.monthlySendsUsed = 0;
    user.monthlySendsReset = getNextResetDate();
    await user.save();
  }

  const limit = limits.monthlySends;
  const used = user.monthlySendsUsed;
  const allowed = limit === -1 || used < limit;

  return {
    allowed,
    used,
    limit,
    resetsAt: user.monthlySendsReset,
  };
}

export async function incrementAnalysisCount(userId: string): Promise<void> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Reset if needed before incrementing
  if (shouldResetCounter(user.monthlyAnalysesReset)) {
    user.monthlyAnalysesUsed = 1;
    user.monthlyAnalysesReset = getNextResetDate();
  } else {
    user.monthlyAnalysesUsed += 1;
  }

  await user.save();
}

export async function incrementSendCount(userId: string): Promise<void> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Reset if needed before incrementing
  if (shouldResetCounter(user.monthlySendsReset)) {
    user.monthlySendsUsed = 1;
    user.monthlySendsReset = getNextResetDate();
  } else {
    user.monthlySendsUsed += 1;
  }

  await user.save();
}

export function canAccessFeature(plan: string, feature: string): boolean {
  const planKey = (plan || 'free') as PlanName;
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
  return (limits.features as readonly string[]).includes(feature);
}

export function getPlanLimits(plan: string): (typeof PLAN_LIMITS)[PlanName] {
  const planKey = (plan || 'free') as PlanName;
  return PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
}
