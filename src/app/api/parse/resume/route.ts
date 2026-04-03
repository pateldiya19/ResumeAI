import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { callClaudeJSON } from '@/lib/claude';
import { RESUME_STRUCTURER } from '@/lib/ai/prompts';
import { rateLimit } from '@/lib/utils/rate-limiter';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed } = rateLimit(`parse-resume:${session.user.id}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { resumeText } = await req.json();
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
    return NextResponse.json(
      { error: 'Resume text too short. Minimum 50 characters required.' },
      { status: 400 }
    );
  }

  try {
    const structured = await callClaudeJSON(RESUME_STRUCTURER, resumeText.trim(), {
      maxTokens: 4096,
      temperature: 0.1,
    });
    return NextResponse.json(structured);
  } catch (error: any) {
    console.error('[parse/resume] Claude structuring failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to structure resume' },
      { status: 500 }
    );
  }
}
