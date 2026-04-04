import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Analysis from '@/models/Analysis';
import Application from '@/models/Application';
import Project from '@/models/Project';
import { BADGES } from '@/lib/badges/badge-definitions';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const [user, totalAnalyses, totalEmails, totalProjects] = await Promise.all([
      User.findById(session.user.id).lean(),
      Analysis.countDocuments({ userId: session.user.id }),
      Application.countDocuments({ userId: session.user.id }),
      Project.countDocuments({ userId: session.user.id }),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const stats: Record<string, number> = { totalAnalyses, totalEmails, totalProjects, chatMessages: 1 };
    const userData = user as Record<string, unknown>;

    const earned = BADGES.filter(b => {
      try { return b.condition(userData, stats); } catch { return false; }
    }).map(b => ({ id: b.id, name: b.name, description: b.description, icon: b.icon, tier: b.tier }));

    const earnedIds = new Set(earned.map(b => b.id));
    const locked = BADGES.filter(b => !earnedIds.has(b.id)).map(b => ({ id: b.id, name: b.name, hint: b.description, icon: b.icon, tier: b.tier }));

    return NextResponse.json({ earned, locked, totalEarned: earned.length, totalAvailable: BADGES.length });
  } catch (error) {
    console.error('GET /api/user/badges error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
