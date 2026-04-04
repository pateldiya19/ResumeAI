import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Analysis from '@/models/Analysis';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    await connectDB();

    const analysis = await Analysis.findById(id).select(
      '-target.scrapedEmail -target.rawData'
    );
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Verify ownership (or admin)
    if (
      analysis.userId.toString() !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if email sending is available
    const fullAnalysis = await Analysis.findById(id).select('target.scrapedEmail');
    const canSendEmail =
      !!fullAnalysis?.target?.scrapedEmail &&
      ['pro', 'enterprise'].includes(session.user.plan);

    const response: Record<string, unknown> = { ...analysis.toObject() };
    response.canSendEmail = canSendEmail;
    // Include recruiter email for mailto link (only for the owner)
    response.targetEmail = fullAnalysis?.target?.scrapedEmail || '';
    delete response.__v;

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/analyze/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
