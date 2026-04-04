import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { callGPTJSON } from '@/lib/openai';
import { rateLimit } from '@/lib/utils/rate-limiter';

const PROMPT = `You are a LinkedIn optimization expert. Generate LinkedIn content based on this resume data.

RESPOND ONLY WITH JSON:
{
  "headlines": ["headline1 (max 120 chars)", "headline2", "headline3"],
  "summary": "200-250 word LinkedIn about section"
}

Rules:
- Headlines: specific, include key skill + notable company + impact metric. Avoid "passionate" or "hardworking".
- Summary: first-person, conversational, opens with a hook (not "I am a..."), include 1-2 specific achievements with numbers.`;

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { allowed } = rateLimit(`linkedin:${session.user.id}`, 5, 60000);
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });

    await connectDB();
    const user = await User.findById(session.user.id).select('parsedResume');
    if (!user?.parsedResume) return NextResponse.json({ error: 'No resume data. Complete onboarding first.' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const targetRole = (body as Record<string, string>).targetRole || '';

    const userMsg = `Resume: ${JSON.stringify(user.parsedResume)}\n\nTarget role: ${targetRole || 'general professional branding'}`;
    const result = await callGPTJSON<{ headlines: string[]; summary: string }>(PROMPT, userMsg, { temperature: 0.7, model: 'gpt-4o-mini' });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/generate/linkedin error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
