import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Analysis from '@/models/Analysis';
import { AnalyzeSchema, Mode1AnalyzeSchema, Mode2AnalyzeSchema } from '@/lib/utils/validators';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { checkAnalysisLimit, incrementAnalysisCount } from '@/lib/services/usage-tracker';
import { runAnalysisPipeline } from '@/lib/services/analysis-orchestrator';
import { analyzeResumeOnly } from '@/lib/ai/mode1-analyzer';
import { analyzeJobFit } from '@/lib/ai/mode2-analyzer';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const status = searchParams.get('status');

    const query: Record<string, unknown> = { userId: session.user.id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const [analyses, total] = await Promise.all([
      Analysis.find(query)
        .select('status mode target.name target.company scores.overallScore mode1Results.ats_score mode1Results.overall_verdict mode2Results.job_match_score mode2Results.fit_verdict generatedEmails.tone generatedEmails.subject generatedEmails.body generatedEmails.isFavorite canSendEmail createdAt updatedAt errorMessage')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Analysis.countDocuments(query),
    ]);

    return NextResponse.json(analyses);
  } catch (error) {
    console.error('GET /api/analyze error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 analyses per minute
  const { allowed } = rateLimit(`analyze:${session.user.id}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json();
  const mode = body.mode || 'full_application';

  await connectDB();

  // Check usage limits
  const limitCheck = await checkAnalysisLimit(session.user.id);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: 'Monthly analysis limit reached. Upgrade your plan.', usage: limitCheck },
      { status: 403 }
    );
  }

  // ─── MODE 1: Resume-Only Analysis (synchronous) ───
  if (mode === 'resume_only') {
    console.log('Mode1 Payload:', body); // Debug log
    const validation = Mode1AnalyzeSchema.safeParse(body);
    // Added debug log to inspect validation error details
    if (!validation.success) {
      console.error('Validation Error:', validation.error); // Debug log
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    try {
      const result = await analyzeResumeOnly(validation.data.resumeText);

      // Save to DB
      const analysis = await Analysis.create({
        userId: session.user.id,
        mode: 'resume_only',
        status: 'complete',
        candidate: {
          resumeText: validation.data.resumeText,
          resumeFileName: validation.data.resumeFileName,
        },
        mode1Results: result,
      });

      await incrementAnalysisCount(session.user.id);

      return NextResponse.json({
        _id: analysis._id.toString(),
        mode: 'resume_only',
        status: 'complete',
        ...result,
      });
    } catch (err: any) {
      console.error('[Mode1] Analysis failed:', err);
      return NextResponse.json(
        { error: err.message || 'Resume analysis failed' },
        { status: 500 }
      );
    }
  }

  // ─── MODE 2: Job-Specific Analysis (synchronous) ───
  if (mode === 'job_analysis') {
    const validation = Mode2AnalyzeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    try {
      const result = await analyzeJobFit(
        validation.data.resumeText,
        validation.data.jobDescriptionText
      );

      // Save to DB
      const analysis = await Analysis.create({
        userId: session.user.id,
        mode: 'job_analysis',
        status: 'complete',
        candidate: {
          resumeText: validation.data.resumeText,
          resumeFileName: validation.data.resumeFileName,
        },
        jobDescription: {
          source: 'user_provided',
          rawText: validation.data.jobDescriptionText,
        },
        mode2Results: result,
      });

      await incrementAnalysisCount(session.user.id);

      return NextResponse.json({
        _id: analysis._id.toString(),
        mode: 'job_analysis',
        status: 'complete',
        ...result,
      });
    } catch (err: any) {
      console.error('[Mode2] Analysis failed:', err);
      return NextResponse.json(
        { error: err.message || 'Job analysis failed' },
        { status: 500 }
      );
    }
  }

  // ─── MODE 3: Full Application (existing — UNCHANGED) ───
  const validation = AnalyzeSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Create analysis document
  const analysis = await Analysis.create({
    userId: session.user.id,
    mode: 'full_application',
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
