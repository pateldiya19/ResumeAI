import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { generateJobDescription } from '@/lib/ai/jd-generator';
import type { NormalizedLinkedInProfile } from '@/types/linkedin';

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed } = rateLimit(`generate-jd:${session.user.id}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { targetProfile } = await req.json();
  if (!targetProfile || typeof targetProfile !== 'object') {
    return NextResponse.json(
      { error: 'Target profile data is required' },
      { status: 400 }
    );
  }

  // Validate minimum data for JD generation
  if (!targetProfile.name && !targetProfile.headline && !targetProfile.company) {
    return NextResponse.json(
      { error: 'Target profile must include at least a name, headline, or company' },
      { status: 400 }
    );
  }

  try {
    const jd = await generateJobDescription(targetProfile);
    return NextResponse.json(jd);
  } catch (error: any) {
    console.error('[generate/jd] JD generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate job description' },
      { status: 500 }
    );
  }
}
