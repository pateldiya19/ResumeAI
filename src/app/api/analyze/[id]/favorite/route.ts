import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Analysis from '@/models/Analysis';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { emailIndex, isFavorite } = body as { emailIndex: number; isFavorite: boolean };

    if (typeof emailIndex !== 'number' || typeof isFavorite !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await connectDB();

    const analysis = await Analysis.findById(id);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    if (analysis.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!analysis.generatedEmails || emailIndex >= analysis.generatedEmails.length) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    analysis.generatedEmails[emailIndex].isFavorite = isFavorite;
    await analysis.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/analyze/[id]/favorite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
