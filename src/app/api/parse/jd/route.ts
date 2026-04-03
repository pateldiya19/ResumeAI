import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { parseJobDescription } from '@/lib/parsers/jd-parser';
import { rateLimit } from '@/lib/utils/rate-limiter';

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed } = rateLimit(`parse-jd:${session.user.id}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { jobDescriptionText } = await req.json();
  if (
    !jobDescriptionText ||
    typeof jobDescriptionText !== 'string' ||
    jobDescriptionText.trim().length < 20
  ) {
    return NextResponse.json(
      { error: 'Job description text too short. Minimum 20 characters required.' },
      { status: 400 }
    );
  }

  try {
    const parsed = await parseJobDescription(jobDescriptionText.trim());
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('[parse/jd] JD parsing failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse job description' },
      { status: 500 }
    );
  }
}
