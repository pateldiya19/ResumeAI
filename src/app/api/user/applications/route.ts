import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Application from '@/models/Application';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const status = searchParams.get('status');

    const query: Record<string, unknown> = { userId: session.user.id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const applications = await Application.find(query)
      .select('recipientName recipientCompany emailTone subject status sentAt resendMessageId createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Map to match frontend expected shape
    const mapped = applications.map((app: any) => ({
      _id: app._id.toString(),
      recipientName: app.recipientName,
      recipientCompany: app.recipientCompany,
      tone: app.emailTone,
      subject: app.subject,
      status: app.status,
      sentAt: app.sentAt || app.createdAt,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('GET /api/user/applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
