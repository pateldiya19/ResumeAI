import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { rateLimit } from '@/lib/utils/rate-limiter';
import Analysis from '@/models/Analysis';
import { generateEmails } from '@/lib/ai/email-generator';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed } = rateLimit(`generate-email:${session.user.id}`, 5, 60000);
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

  // Need target data and scores to generate meaningful emails
  if (!analysis.target?.name && !analysis.target?.company) {
    return NextResponse.json(
      { error: 'Analysis does not have target profile data. Wait for scraping to complete.' },
      { status: 400 }
    );
  }

  try {
    // Build match points from scores if available
    const matchPoints: string[] = [];
    if (analysis.scores) {
      if (analysis.scores.atsScore >= 70) {
        matchPoints.push(`Strong ATS score of ${analysis.scores.atsScore}/100`);
      }
      if (analysis.scores.jobFitScore >= 70) {
        matchPoints.push(`High job fit score of ${analysis.scores.jobFitScore}/100`);
      }
    }

    const result = await generateEmails({
      matchPoints,
      candidateName: analysis.candidate.name,
      candidateSkills: analysis.candidate.skills,
      recruiterPersona: analysis.recruiterPersona || {
        name: analysis.target.name || 'Unknown',
        headline: analysis.target.headline || '',
        company: analysis.target.company || '',
        communicationStyle: 'formal',
      },
      jobDescription: {
        title: analysis.jobDescription?.title || '',
        company: analysis.jobDescription?.company || analysis.target.company || '',
        requiredSkills: analysis.jobDescription?.requiredSkills || [],
        responsibilities: analysis.jobDescription?.responsibilities || [],
      },
    });

    // Persist the generated emails on the analysis
    analysis.generatedEmails = result.emails;
    await analysis.save();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[generate/email] Email generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate emails' },
      { status: 500 }
    );
  }
}
