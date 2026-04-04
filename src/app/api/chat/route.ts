import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { callGPT } from '@/lib/openai';
import { rateLimit } from '@/lib/utils/rate-limiter';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed } = rateLimit(`chat:${session.user.id}`, 20, 60000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    await connectDB();

    const body = await req.json();
    const { message, conversationHistory } = body as {
      message: string;
      conversationHistory: ChatMessage[];
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const user = await User.findById(session.user.id).select(
      'parsedResume linkedinData profileAnalysis name'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resumeContext = user.parsedResume
      ? JSON.stringify(user.parsedResume, null, 2)
      : 'No resume data available';

    const linkedinContext = user.linkedinData
      ? JSON.stringify(user.linkedinData, null, 2)
      : 'No LinkedIn data available';

    const analysisContext = user.profileAnalysis
      ? `ATS Score: ${(user.profileAnalysis as Record<string, unknown>).ats_score}/100
Key Issues: ${Array.isArray((user.profileAnalysis as Record<string, unknown>).formatting_issues) ? ((user.profileAnalysis as Record<string, unknown>).formatting_issues as Array<{ message: string }>).map((i) => i.message).join(', ') : 'None'}
Missing Sections: ${Array.isArray((user.profileAnalysis as Record<string, unknown>).missing_sections) ? ((user.profileAnalysis as Record<string, unknown>).missing_sections as string[]).join(', ') : 'None'}`
      : 'No analysis data available';

    const systemPrompt = `You are an expert AI career coach. You have complete knowledge of this person's professional profile:

RESUME DATA:
${resumeContext}

LINKEDIN DATA:
${linkedinContext}

LATEST ANALYSIS:
${analysisContext}

RULES:
- Give specific, actionable advice based on THEIR actual resume content
- When rewriting bullets, use THEIR real experience — don't fabricate
- Reference their actual companies, roles, and skills by name
- Be encouraging but honest about weaknesses
- If they paste a JD, compare it against their actual skills and experience
- Keep responses concise — max 200 words unless they ask for longer content
- Format responses with markdown for readability`;

    // Build conversation for OpenAI
    const history = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-10).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
      : '';

    const userMessage = history
      ? `Previous conversation:\n${history}\n\nUser: ${message}`
      : message;

    const reply = await callGPT(systemPrompt, userMessage, {
      temperature: 0.7,
      model: 'gpt-4o-mini',
      maxTokens: 1024,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
