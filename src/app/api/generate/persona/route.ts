import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { rateLimit } from '@/lib/utils/rate-limiter';
import Analysis from '@/models/Analysis';
import { buildPersona } from '@/lib/ai/persona-builder';
import type { NormalizedLinkedInProfile } from '@/types/linkedin';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed } = rateLimit(`generate-persona:${session.user.id}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { analysisId } = await req.json();
  if (!analysisId || typeof analysisId !== 'string') {
    return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
  }

  await connectDB();

  const analysis = await Analysis.findById(analysisId);
  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }
  if (analysis.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Need target data to build persona
  if (!analysis.target?.name && !analysis.target?.headline) {
    return NextResponse.json(
      { error: 'Analysis does not have target profile data. Wait for scraping to complete.' },
      { status: 400 }
    );
  }

  try {
    // Construct a NormalizedLinkedInProfile from the analysis target data
    const targetProfile = {
      name: analysis.target.name || '',
      headline: analysis.target.headline || '',
      company: analysis.target.company || '',
      companySize: analysis.target.companySize || '',
      industry: analysis.target.industry || '',
      location: analysis.target.location || '',
      summary: analysis.target.summary || '',
      experience: (analysis.target.experience || []).map((exp) => ({
        company: exp.company,
        title: exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
      })),
      recentPosts: (analysis.target.recentPosts || []).map((post) => ({
        text: post.text,
        date: post.date,
        likes: post.likes,
        comments: post.comments,
      })),
      skills: analysis.target.skills || [],
      connections: analysis.target.connections || 0,
      profileUrl: analysis.target.linkedinUrl || '',
    };

    const persona = await buildPersona(targetProfile);

    // Persist the persona on the analysis
    analysis.recruiterPersona = {
      name: persona.name,
      headline: persona.headline,
      company: persona.company,
      communicationStyle: persona.communicationStyle as 'formal' | 'casual' | 'mixed',
      priorities: persona.priorities,
      painPoints: persona.painPoints,
      recentTopics: persona.recentTopics,
      recommendedApproach: persona.recommendedApproach,
      culturalSignals: persona.culturalSignals,
    };
    await analysis.save();

    return NextResponse.json(persona);
  } catch (error: any) {
    console.error('[generate/persona] Persona build failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to build recruiter persona' },
      { status: 500 }
    );
  }
}
