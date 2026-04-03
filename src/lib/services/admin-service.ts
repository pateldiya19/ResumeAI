import { connectDB } from '@/lib/db';
import User, { IUser } from '@/models/User';
import Analysis from '@/models/Analysis';
import ModerationFlag from '@/models/ModerationFlag';
import Application from '@/models/Application';
import CreditTransaction from '@/models/CreditTransaction';
import mongoose from 'mongoose';

// ---- Types ----

interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  totalFlags: number;
  pendingFlags: number;
  userGrowth: number;
  analysisGrowth: number;
  activeUsersLast30Days: number;
  planDistribution: { free: number; pro: number; enterprise: number };
}

interface UserListParams {
  page: number;
  limit: number;
  search?: string;
  plan?: string;
  role?: string;
  sort?: string;
}

interface UserListResult {
  users: any[];
  total: number;
  page: number;
  totalPages: number;
}

interface AdminAction {
  action: 'ban' | 'unban' | 'change_plan' | 'add_credits';
  plan?: 'free' | 'pro' | 'enterprise';
  credits?: number;
  reason?: string;
}

interface PipelineStatus {
  activeAnalyses: number;
  statusBreakdown: Record<string, number>;
  avgProcessingTimeMs: number;
  recentFailures: number;
}

interface RevenueData {
  dailyRevenue: Array<{ date: string; amount: number }>;
  planDistribution: { free: number; pro: number; enterprise: number };
  topSpenders: Array<{ userId: string; name: string; email: string; totalSpent: number }>;
  totalRevenue30Days: number;
}

interface ModerationItem {
  _id: string;
  type: string;
  reason: string;
  description: string;
  status: string;
  autoFlagged: boolean;
  targetUser: { _id: string; name: string; email: string } | null;
  createdAt: Date;
}

// ---- Service Functions ----

export async function getAdminStats(): Promise<AdminStats> {
  await connectDB();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalAnalyses,
    totalFlags,
    pendingFlags,
    usersLast30,
    usersPrev30,
    analysesLast30,
    analysesPrev30,
    activeUsersLast30Days,
    planAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Analysis.countDocuments(),
    ModerationFlag.countDocuments(),
    ModerationFlag.countDocuments({ status: 'pending' }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
    Analysis.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Analysis.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
    User.countDocuments({ lastActiveAt: { $gte: thirtyDaysAgo } }),
    User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]),
  ]);

  const userGrowth =
    usersPrev30 > 0
      ? Math.round(((usersLast30 - usersPrev30) / usersPrev30) * 100)
      : usersLast30 > 0
        ? 100
        : 0;

  const analysisGrowth =
    analysesPrev30 > 0
      ? Math.round(((analysesLast30 - analysesPrev30) / analysesPrev30) * 100)
      : analysesLast30 > 0
        ? 100
        : 0;

  const planDistribution = { free: 0, pro: 0, enterprise: 0 };
  for (const entry of planAgg) {
    const plan = entry._id as string;
    if (plan in planDistribution) {
      planDistribution[plan as keyof typeof planDistribution] = entry.count;
    }
  }

  return {
    totalUsers,
    totalAnalyses,
    totalFlags,
    pendingFlags,
    userGrowth,
    analysisGrowth,
    activeUsersLast30Days,
    planDistribution,
  };
}

export async function getUsersList(params: UserListParams): Promise<UserListResult> {
  await connectDB();

  const { page = 1, limit = 20, search, plan, role, sort } = params;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (plan && ['free', 'pro', 'enterprise'].includes(plan)) {
    filter.plan = plan;
  }
  if (role && ['user', 'admin'].includes(role)) {
    filter.role = role;
  }

  let sortObj: any = { createdAt: -1 };
  if (sort === 'name') sortObj = { name: 1 };
  else if (sort === '-name') sortObj = { name: -1 };
  else if (sort === 'email') sortObj = { email: 1 };
  else if (sort === 'lastActive') sortObj = { lastActiveAt: -1 };
  else if (sort === 'oldest') sortObj = { createdAt: 1 };

  const [users, total] = await Promise.all([
    User.aggregate([
      { $match: filter },
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
          password: 0,
          analyses: 0,
        },
      },
    ]),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getUserDetail(userId: string): Promise<any> {
  await connectDB();

  const objectId = new mongoose.Types.ObjectId(userId);

  const [user, analyses, projects, flags, applications] = await Promise.all([
    User.findById(objectId).select('-password').lean(),
    Analysis.find({ userId: objectId })
      .sort({ createdAt: -1 })
      .select('status scores.overallScore jobDescription.title target.company createdAt')
      .lean(),
    (await import('@/models/Project')).default
      .find({ userId: objectId })
      .sort({ createdAt: -1 })
      .lean(),
    ModerationFlag.find({ targetUserId: objectId })
      .sort({ createdAt: -1 })
      .lean(),
    Application.find({ userId: objectId })
      .sort({ createdAt: -1 })
      .select('recipientName recipientCompany status emailTone sentAt createdAt')
      .lean(),
  ]);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  return {
    ...user,
    analyses,
    projects,
    flags,
    applications,
  };
}

export async function updateUser(userId: string, action: AdminAction): Promise<any> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  switch (action.action) {
    case 'ban':
      user.isBanned = true;
      user.banReason = action.reason || 'Banned by admin';
      break;

    case 'unban':
      user.isBanned = false;
      user.banReason = undefined;
      break;

    case 'change_plan':
      if (!action.plan) {
        throw new Error('Plan is required for change_plan action');
      }
      user.plan = action.plan;
      // Reset usage counters on plan change
      user.monthlyAnalysesUsed = 0;
      user.monthlySendsUsed = 0;
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1, 1);
      nextReset.setHours(0, 0, 0, 0);
      user.monthlyAnalysesReset = nextReset;
      user.monthlySendsReset = nextReset;
      break;

    case 'add_credits':
      if (typeof action.credits !== 'number' || action.credits <= 0) {
        throw new Error('Credits must be a positive number');
      }
      user.credits += action.credits;

      // Record the credit transaction
      await CreditTransaction.create({
        userId: user._id,
        type: 'bonus',
        amount: action.credits,
        balance: user.credits,
        description: action.reason || `Admin added ${action.credits} credits`,
      });
      break;

    default:
      throw new Error(`Unknown action: ${action.action}`);
  }

  await user.save();

  const result = user.toObject();
  delete result.password;
  return result;
}

export async function getPipelineStatus(): Promise<PipelineStatus> {
  await connectDB();

  const activeStatuses = ['pending', 'scraping_candidate', 'scraping_target', 'parsing_jd', 'analyzing', 'generating'];

  const [activeAnalyses, statusAgg, completedAnalyses, recentFailures] = await Promise.all([
    Analysis.countDocuments({ status: { $in: activeStatuses } }),
    Analysis.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Analysis.find({ status: 'complete' })
      .sort({ updatedAt: -1 })
      .limit(100)
      .select('createdAt updatedAt')
      .lean(),
    Analysis.countDocuments({
      status: 'failed',
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
  ]);

  const statusBreakdown: Record<string, number> = {};
  for (const entry of statusAgg) {
    statusBreakdown[entry._id as string] = entry.count;
  }

  // Calculate average processing time from recent completed analyses
  let avgProcessingTimeMs = 0;
  if (completedAnalyses.length > 0) {
    const totalMs = completedAnalyses.reduce((sum, a) => {
      const created = new Date(a.createdAt).getTime();
      const updated = new Date(a.updatedAt).getTime();
      return sum + (updated - created);
    }, 0);
    avgProcessingTimeMs = Math.round(totalMs / completedAnalyses.length);
  }

  return {
    activeAnalyses,
    statusBreakdown,
    avgProcessingTimeMs,
    recentFailures,
  };
}

export async function getRevenueData(): Promise<RevenueData> {
  await connectDB();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [dailyAgg, planAgg, topSpendersAgg] = await Promise.all([
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
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]),
    CreditTransaction.aggregate([
      {
        $match: {
          type: 'purchase',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$amount' },
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
          totalSpent: 1,
        },
      },
    ]),
  ]);

  const dailyRevenue = dailyAgg.map((d) => ({
    date: d._id as string,
    amount: d.amount as number,
  }));

  const planDistribution = { free: 0, pro: 0, enterprise: 0 };
  for (const entry of planAgg) {
    const plan = entry._id as string;
    if (plan in planDistribution) {
      planDistribution[plan as keyof typeof planDistribution] = entry.count;
    }
  }

  const totalRevenue30Days = dailyRevenue.reduce((sum, d) => sum + d.amount, 0);

  return {
    dailyRevenue,
    planDistribution,
    topSpenders: topSpendersAgg.map((s) => ({
      userId: s.userId.toString(),
      name: s.name,
      email: s.email,
      totalSpent: s.totalSpent,
    })),
    totalRevenue30Days,
  };
}

export async function getModerationQueue(status?: string): Promise<ModerationItem[]> {
  await connectDB();

  const filter: any = {};
  if (status && ['pending', 'approved', 'rejected', 'banned'].includes(status)) {
    filter.status = status;
  } else {
    filter.status = 'pending';
  }

  const flags = await ModerationFlag.aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $limit: 100 },
    {
      $lookup: {
        from: 'users',
        localField: 'targetUserId',
        foreignField: '_id',
        as: 'targetUser',
      },
    },
    {
      $unwind: {
        path: '$targetUser',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        type: 1,
        reason: 1,
        description: 1,
        status: 1,
        autoFlagged: 1,
        createdAt: 1,
        targetUser: {
          _id: '$targetUser._id',
          name: '$targetUser.name',
          email: '$targetUser.email',
        },
      },
    },
  ]);

  return flags as ModerationItem[];
}

export async function moderateItem(
  flagId: string,
  action: string,
  reviewerId: string,
  note?: string
): Promise<any> {
  await connectDB();

  const flag = await ModerationFlag.findById(flagId);
  if (!flag) {
    throw new Error(`Moderation flag not found: ${flagId}`);
  }

  const reviewerObjectId = new mongoose.Types.ObjectId(reviewerId);

  switch (action) {
    case 'approve':
      flag.status = 'approved';
      break;

    case 'reject':
      flag.status = 'rejected';
      break;

    case 'ban':
      flag.status = 'banned';
      // Also ban the target user
      await User.findByIdAndUpdate(flag.targetUserId, {
        isBanned: true,
        banReason: note || `Banned due to moderation flag: ${flag.type}`,
      });
      break;

    default:
      throw new Error(`Unknown moderation action: ${action}`);
  }

  flag.reviewedBy = reviewerObjectId;
  flag.reviewedAt = new Date();
  flag.reviewNote = note || undefined;

  await flag.save();
  return flag.toObject();
}
