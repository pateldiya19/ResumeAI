import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { rateLimit } from '@/lib/utils/rate-limiter';
import Analysis from '@/models/Analysis';
import Project from '@/models/Project';
import { rewriteResume } from '@/lib/ai/resume-rewriter';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed } = rateLimit(`generate-resume:${session.user.id}`, 5, 60000);
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

  // Ensure analysis has enough data for resume rewriting
  if (!analysis.candidate?.resumeText || analysis.candidate.resumeText.length < 50) {
    return NextResponse.json(
      { error: 'Analysis does not have sufficient resume data' },
      { status: 400 }
    );
  }

  // Fetch highlighted projects for additional context
  const highlightedProjects = await Project.find({
    userId: analysis.userId,
    isHighlighted: true,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  try {
    const result = await rewriteResume({
      candidateName: analysis.candidate.name,
      resumeText: analysis.candidate.resumeText,
      experience: analysis.candidate.experience,
      skills: analysis.candidate.skills,
      education: analysis.candidate.education,
      jobTitle: analysis.jobDescription?.title || '',
      requiredSkills: analysis.jobDescription?.requiredSkills || [],
      preferredSkills: analysis.jobDescription?.preferredSkills || [],
      responsibilities: analysis.jobDescription?.responsibilities || [],
      keywords: analysis.jobDescription?.keywords || [],
      experienceLevel: analysis.jobDescription?.experienceLevel || '',
      recruiterPersona: analysis.recruiterPersona || {},
      projects: highlightedProjects.map((p) => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack,
      })),
    });

    // Persist the result on the analysis
    analysis.optimizedResume = result;
    await analysis.save();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[generate/resume] Resume rewrite failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to rewrite resume' },
      { status: 500 }
    );
  }
}
