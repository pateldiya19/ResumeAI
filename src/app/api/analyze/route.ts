import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Analysis from '@/models/Analysis';
import { AnalyzeSchema } from '@/lib/utils/validators';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { checkAnalysisLimit, incrementAnalysisCount } from '@/lib/services/usage-tracker';
import { runAnalysisPipeline } from '@/lib/services/analysis-orchestrator';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 analyses per minute
  const { allowed } = rateLimit(`analyze:${session.user.id}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json();
  const validation = AnalyzeSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await connectDB();

  // Check usage limits
  const limitCheck = await checkAnalysisLimit(session.user.id);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: 'Monthly analysis limit reached. Upgrade your plan.', usage: limitCheck },
      { status: 403 }
    );
  }

  // Create analysis document
  const analysis = await Analysis.create({
    userId: session.user.id,
    status: 'pending',
    candidate: {
      resumeText: validation.data.resumeText,
      resumeFileName: validation.data.resumeFileName,
      linkedinUrl: validation.data.candidateLinkedInUrl || undefined,
    },
    target: {
      linkedinUrl: validation.data.targetLinkedInUrl,
    },
    jobDescription: validation.data.jobDescriptionText
      ? {
          source: 'user_provided',
          rawText: validation.data.jobDescriptionText,
        }
      : undefined,
  });

  // Increment usage count
  await incrementAnalysisCount(session.user.id);

  // Fire-and-forget pipeline
  runAnalysisPipeline(analysis._id.toString()).catch((err) => {
    console.error('Pipeline error:', err);
  });

  return NextResponse.json(
    { analysisId: analysis._id.toString(), status: 'pending' },
    { status: 202 }
  );
}
