export interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  totalRevenue: number;
  totalFlags: number;
  userGrowth: number;
  analysisGrowth: number;
  revenueGrowth: number;
}

export interface UserListItem {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  plan: string;
  credits: number;
  isBanned: boolean;
  analysisCount: number;
  createdAt: string;
  lastActiveAt: string;
}

export interface PipelineStatus {
  activeAnalyses: number;
  statusBreakdown: Record<string, number>;
  avgProcessingTime: number;
  recentFailures: any[];
}

export interface RevenueData {
  dailyRevenue: { date: string; amount: number }[];
  planDistribution: Record<string, number>;
  creditsInCirculation: number;
  topSpenders: { userId: string; name: string; total: number }[];
}

export interface ModerationItem {
  _id: string;
  type: string;
  reason: string;
  description: string;
  targetUserId: any;
  status: string;
  autoFlagged: boolean;
  createdAt: string;
}

export interface AdminAction {
  action: 'ban' | 'unban' | 'change_plan' | 'add_credits';
  plan?: string;
  credits?: number;
  reason?: string;
}
