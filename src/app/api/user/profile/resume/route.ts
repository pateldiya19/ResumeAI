import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { callGPTJSON } from '@/lib/openai';
import { analyzeResumeOnly } from '@/lib/ai/mode1-analyzer';
import { sanitizeResumeText } from '@/lib/utils/sanitize-resume';
import { stripPII, stripPIIFromParsedResume } from '@/lib/utils/strip-pii';

const RESUME_PARSE_PROMPT = `You are an expert resume parser. Extract structured data from the resume text.

Return ONLY valid JSON:
{
  "name": "<full name>",
  "headline": "<professional headline/title>",
  "summary": "<professional summary if present, else empty string>",
  "skills": ["<skill1>", "<skill2>"],
  "experience": [
    {
      "company": "<company name>",
      "title": "<job title>",
      "startDate": "<start date>",
      "endDate": "<end date or 'Present'>",
      "duration": "<e.g. '2 years'>",
      "bullets": ["<bullet1>", "<bullet2>"]
    }
  ],
  "education": [
    {
      "institution": "<school name>",
      "degree": "<degree>",
      "field": "<field of study>",
      "startDate": "<start>",
      "endDate": "<end>"
    }
  ],
  "certifications": ["<cert1>"]
}`;

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { resumeText, resumeFileName, parsedResumeData, analyze } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json({ error: 'Resume text is required.' }, { status: 400 });
    }

    // If structured data is provided, allow shorter text (editor may have mostly structured fields)
    if (!parsedResumeData && resumeText.trim().length < 50) {
      return NextResponse.json({ error: 'Resume text too short.' }, { status: 400 });
    }

    const cleanedText = sanitizeResumeText(resumeText);

    // If structured data is provided directly (from editor), use it as-is
    // Do NOT strip PII — user explicitly entered their phone/email in the editor
    let parsedResume: Record<string, unknown>;
    if (parsedResumeData && typeof parsedResumeData === 'object') {
      parsedResume = { ...parsedResumeData };
    } else {
      // Parse resume text with GPT (for file uploads)
      try {
        parsedResume = await callGPTJSON<Record<string, unknown>>(
          RESUME_PARSE_PROMPT,
          cleanedText,
          { temperature: 0.1, model: 'gpt-4o-mini' }
        );
      } catch {
        parsedResume = { name: 'User', skills: [], experience: [], education: [] };
      }
      parsedResume = stripPIIFromParsedResume(parsedResume);
    }

    // Only strip PII from stored text if NOT from editor (editor data has user-entered contact info)
    const storedResumeText = parsedResumeData ? cleanedText : stripPII(cleanedText);

    // Only re-run ATS analysis if explicitly requested
    let profileAnalysis: Record<string, unknown> | null = null;
    if (analyze) {
      try {
        // Use the full resume text for ATS analysis (including contact info)
        const result = await analyzeResumeOnly(resumeText);
        profileAnalysis = result as unknown as Record<string, unknown>;
      } catch (err) {
        console.error('[Profile/Resume] ATS analysis failed:', err);
        // keep null — save will still succeed
      }
    }

    const updateData: Record<string, unknown> = {
      resumeText: storedResumeText,
      resumeFileName: resumeFileName || 'resume',
      parsedResume,
      profileLastUpdated: new Date(),
    };
    if (profileAnalysis) {
      updateData.profileAnalysis = profileAnalysis;
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    ).select('parsedResume profileAnalysis profileLastUpdated');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      parsedResume: user.parsedResume,
      profileAnalysis: user.profileAnalysis,
      profileLastUpdated: user.profileLastUpdated,
    });
  } catch (error) {
    console.error('PUT /api/user/profile/resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
