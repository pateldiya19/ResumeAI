import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { callGPTJSON } from '@/lib/openai';
import { analyzeResumeOnly } from '@/lib/ai/mode1-analyzer';
import { sanitizeResumeText } from '@/lib/utils/sanitize-resume';
import { stripPII, stripPIIFromParsedResume } from '@/lib/utils/strip-pii';
import { scrapeLinkedInProfile } from '@/lib/apify';
import { normalizeLinkedInProfile } from '@/lib/parsers/linkedin-normalizer';

const RESUME_PARSE_PROMPT = `You are an expert resume parser. Extract structured data from the resume text.

Return ONLY valid JSON:
{
  "name": "<full name>",
  "headline": "<professional headline/title, e.g. 'Senior Software Engineer'>",
  "summary": "<professional summary if present, else empty string>",
  "skills": ["<skill1>", "<skill2>", ...],
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
  "certifications": ["<cert1>", "<cert2>"]
}

Extract ALL information present. If a field isn't found, use empty string or empty array.`;

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { resumeText, resumeFileName, linkedinUrl } = body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Resume text too short. Minimum 50 characters required.' },
        { status: 400 }
      );
    }

    // 1. Sanitize resume text
    const cleanedText = sanitizeResumeText(resumeText);

    // 2. Parse resume with OpenAI
    let parsedResume: Record<string, unknown>;
    try {
      parsedResume = await callGPTJSON<Record<string, unknown>>(
        RESUME_PARSE_PROMPT,
        cleanedText,
        { temperature: 0.1, model: 'gpt-4o-mini' }
      );
    } catch (err) {
      console.error('[Onboarding] Resume parsing failed:', err);
      parsedResume = { name: 'User', skills: [], experience: [], education: [] };
    }

    // 3. Strip PII from parsed resume
    parsedResume = stripPIIFromParsedResume(parsedResume);
    const storedResumeText = stripPII(cleanedText);

    // 4. Scrape LinkedIn (if URL provided)
    let linkedinData: Record<string, unknown> | null = null;
    if (linkedinUrl && typeof linkedinUrl === 'string' && linkedinUrl.includes('linkedin.com')) {
      try {
        const rawProfile = await scrapeLinkedInProfile(linkedinUrl);
        const normalized = normalizeLinkedInProfile(rawProfile);
        linkedinData = {
          name: normalized.name,
          headline: normalized.headline,
          company: normalized.company,
          industry: normalized.industry,
          location: normalized.location,
          summary: normalized.summary,
          skills: normalized.skills,
          experience: normalized.experience,
          connections: normalized.connections,
        };
      } catch (err) {
        console.error('[Onboarding] LinkedIn scraping failed:', err);
      }
    }

    // 5. Run initial ATS health check (Mode 1 style)
    let profileAnalysis: Record<string, unknown> | null = null;
    try {
      const analysisResult = await analyzeResumeOnly(cleanedText);
      profileAnalysis = analysisResult as unknown as Record<string, unknown>;
    } catch (err) {
      console.error('[Onboarding] ATS analysis failed:', err);
    }

    // 6. Save everything to user
    await User.findByIdAndUpdate(session.user.id, {
      onboardingComplete: true,
      resumeText: storedResumeText,
      resumeFileName: resumeFileName || 'resume',
      linkedinUrl: linkedinUrl || '',
      linkedinData,
      parsedResume,
      profileAnalysis,
      profileLastUpdated: new Date(),
      lastActiveAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    console.error('POST /api/onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
