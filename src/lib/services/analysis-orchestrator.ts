import { connectDB } from '@/lib/db';
import Analysis, { IAnalysis } from '@/models/Analysis';
import User from '@/models/User';
import Project from '@/models/Project';
import ModerationFlag from '@/models/ModerationFlag';
import { callClaudeJSON } from '@/lib/claude';
import { RESUME_STRUCTURER } from '@/lib/ai/prompts';
import { scrapeLinkedInProfile, findEmailByLinkedIn } from '@/lib/apify';
import { normalizeLinkedInProfile } from '@/lib/parsers/linkedin-normalizer';
import { parseJobDescription } from '@/lib/parsers/jd-parser';
import { scoreATS } from '@/lib/ai/ats-scorer';
import { scoreJobFit } from '@/lib/ai/job-fit-scorer';
import { checkConsistency } from '@/lib/ai/consistency-checker';
import { generateJobDescription } from '@/lib/ai/jd-generator';
import { rewriteResume } from '@/lib/ai/resume-rewriter';
import { buildPersona } from '@/lib/ai/persona-builder';
import { generateEmails } from '@/lib/ai/email-generator';
import { NormalizedLinkedInProfile } from '@/types/linkedin';

const INAPPROPRIATE_PATTERNS = [
  /\b(fuck|shit|damn|bitch|ass(hole)?)\b/i,
  /\b(kill|murder|threat|weapon|bomb)\b/i,
  /\b(nude|naked|sex|porn)\b/i,
  /\b(nigger|faggot|retard)\b/i,
];

function containsInappropriateContent(text: string): boolean {
  return INAPPROPRIATE_PATTERNS.some((pattern) => pattern.test(text));
}

export async function runAnalysisPipeline(analysisId: string): Promise<void> {
  await connectDB();

  const analysis = await Analysis.findById(analysisId);
  if (!analysis) {
    throw new Error(`Analysis not found: ${analysisId}`);
  }

  const user = await User.findById(analysis.userId);
  if (!user) {
    throw new Error(`User not found for analysis: ${analysisId}`);
  }

  try {
    // ---------------------------------------------------------------
    // STEP 1: SETUP
    // ---------------------------------------------------------------
    analysis.status = 'pending';
    await analysis.save();

    // ---------------------------------------------------------------
    // STEP 2: PARSE RESUME — call Claude to structure the raw text
    // ---------------------------------------------------------------
    let structuredResume: {
      name: string;
      headline: string;
      summary: string;
      experience: Array<{
        company: string;
        title: string;
        startDate: string;
        endDate: string;
        duration: string;
        description: string;
        bullets: string[];
      }>;
      education: Array<{
        institution: string;
        degree: string;
        field: string;
        startDate: string;
        endDate: string;
        gpa?: string;
      }>;
      skills: string[];
      certifications: string[];
    };

    try {
      structuredResume = await callClaudeJSON(
        RESUME_STRUCTURER,
        analysis.candidate.resumeText,
        { maxTokens: 4096, temperature: 0.1 }
      );

      analysis.candidate.name = structuredResume.name || analysis.candidate.name;
      analysis.candidate.headline = structuredResume.headline || '';
      analysis.candidate.summary = structuredResume.summary || '';
      analysis.candidate.experience = (structuredResume.experience || []).map((exp) => ({
        company: exp.company || '',
        title: exp.title || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        duration: exp.duration || '',
        description: exp.description || '',
        bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
      }));
      analysis.candidate.education = (structuredResume.education || []).map((edu) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        field: edu.field || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        gpa: edu.gpa,
      }));
      analysis.candidate.skills = Array.isArray(structuredResume.skills)
        ? structuredResume.skills
        : [];
      analysis.candidate.certifications = Array.isArray(structuredResume.certifications)
        ? structuredResume.certifications
        : [];

      await analysis.save();
    } catch (err) {
      console.error('[Pipeline] Resume structuring failed:', err);
      // Continue with raw text — scoring will still work but less accurately
    }

    // ---------------------------------------------------------------
    // STEP 3: SCRAPE CANDIDATE LINKEDIN (optional)
    // ---------------------------------------------------------------
    let candidateLinkedIn: NormalizedLinkedInProfile | null = null;

    if (analysis.candidate.linkedinUrl) {
      analysis.status = 'scraping_candidate';
      await analysis.save();

      try {
        const rawProfile = await scrapeLinkedInProfile(analysis.candidate.linkedinUrl);
        candidateLinkedIn = normalizeLinkedInProfile(rawProfile);

        analysis.candidate.linkedinData = candidateLinkedIn;

        // Merge LinkedIn data where resume is sparse
        if (!analysis.candidate.name || analysis.candidate.name === 'Unknown') {
          analysis.candidate.name = candidateLinkedIn.name;
        }
        if (!analysis.candidate.headline) {
          analysis.candidate.headline = candidateLinkedIn.headline;
        }
        if (!analysis.candidate.summary) {
          analysis.candidate.summary = candidateLinkedIn.summary;
        }
        if (analysis.candidate.skills.length === 0 && candidateLinkedIn.skills.length > 0) {
          analysis.candidate.skills = candidateLinkedIn.skills;
        }

        await analysis.save();
      } catch (err) {
        console.error('[Pipeline] Candidate LinkedIn scraping failed:', err);
        // Non-fatal — continue without LinkedIn enrichment
      }
    }

    // ---------------------------------------------------------------
    // STEP 4: SCRAPE TARGET LINKEDIN (required)
    // ---------------------------------------------------------------
    analysis.status = 'scraping_target';
    await analysis.save();

    let targetProfile: NormalizedLinkedInProfile | null = null;
    let targetEmail: string | null = null;

    try {
      const rawTargetProfile = await scrapeLinkedInProfile(analysis.target.linkedinUrl);
      targetProfile = normalizeLinkedInProfile(rawTargetProfile);

      analysis.target.name = targetProfile.name;
      analysis.target.headline = targetProfile.headline;
      analysis.target.company = targetProfile.company;
      analysis.target.companySize = targetProfile.companySize;
      analysis.target.industry = targetProfile.industry;
      analysis.target.location = targetProfile.location;
      analysis.target.summary = targetProfile.summary;
      analysis.target.experience = targetProfile.experience.map((exp) => ({
        company: exp.company,
        title: exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
      }));
      analysis.target.recentPosts = targetProfile.recentPosts.map((post) => ({
        text: post.text,
        date: post.date,
        likes: post.likes,
        comments: post.comments,
      }));
      analysis.target.skills = targetProfile.skills;
      analysis.target.connections = targetProfile.connections;
      analysis.target.rawData = rawTargetProfile;

      await analysis.save();
    } catch (err) {
      console.error('[Pipeline] Target LinkedIn scraping failed:', err);
      // Continue — we may still have the URL and can generate emails with limited data
    }

    // Try to find target email separately (uses a fresh scrape or cached data)
    try {
      targetEmail = await findEmailByLinkedIn(analysis.target.linkedinUrl);
      if (targetEmail) {
        analysis.target.scrapedEmail = targetEmail;
        await analysis.save();
      }
    } catch (err) {
      console.error('[Pipeline] Target email lookup failed:', err);
    }

    // ---------------------------------------------------------------
    // STEP 5: PARSE OR GENERATE JOB DESCRIPTION
    // ---------------------------------------------------------------
    analysis.status = 'parsing_jd';
    await analysis.save();

    try {
      if (analysis.jobDescription.rawText && analysis.jobDescription.rawText.trim().length > 20) {
        // User provided a JD — parse it
        const parsedJD = await parseJobDescription(analysis.jobDescription.rawText);

        analysis.jobDescription.source = 'user_provided';
        analysis.jobDescription.title = parsedJD.title;
        analysis.jobDescription.company = parsedJD.company || analysis.target.company;
        analysis.jobDescription.requiredSkills = parsedJD.requiredSkills;
        analysis.jobDescription.preferredSkills = parsedJD.preferredSkills;
        analysis.jobDescription.responsibilities = parsedJD.responsibilities;
        analysis.jobDescription.qualifications = parsedJD.qualifications;
        analysis.jobDescription.experienceLevel = parsedJD.experienceLevel;
        analysis.jobDescription.keywords = parsedJD.keywords;
      } else {
        // No JD — generate one from target context
        const generatedJD = await generateJobDescription({
          targetName: analysis.target.name,
          targetHeadline: analysis.target.headline,
          targetCompany: analysis.target.company,
          targetIndustry: analysis.target.industry,
          targetSkills: analysis.target.skills,
          candidateSkills: analysis.candidate.skills,
          candidateExperience: analysis.candidate.experience.map((e) => ({
            title: e.title,
            company: e.company,
          })),
        });

        analysis.jobDescription.source = 'ai_generated';
        analysis.jobDescription.rawText = generatedJD.rawText || '';
        analysis.jobDescription.title = generatedJD.title;
        analysis.jobDescription.company = generatedJD.company;
        analysis.jobDescription.requiredSkills = generatedJD.requiredSkills;
        analysis.jobDescription.preferredSkills = generatedJD.preferredSkills;
        analysis.jobDescription.responsibilities = generatedJD.responsibilities;
        analysis.jobDescription.qualifications = generatedJD.qualifications;
        analysis.jobDescription.experienceLevel = generatedJD.experienceLevel;
        analysis.jobDescription.keywords = generatedJD.keywords;
      }

      await analysis.save();
    } catch (err) {
      console.error('[Pipeline] JD parsing/generation failed:', err);
      // Non-fatal — scoring will use whatever data is available
    }

    // ---------------------------------------------------------------
    // STEP 6: SCORING (parallel)
    // ---------------------------------------------------------------
    analysis.status = 'analyzing';
    await analysis.save();

    const hasLinkedInData = !!candidateLinkedIn;

    const resumeData = {
      resumeText: analysis.candidate.resumeText,
      name: analysis.candidate.name,
      skills: analysis.candidate.skills,
      experience: analysis.candidate.experience,
      education: analysis.candidate.education,
      summary: analysis.candidate.summary,
    };

    const jdData = {
      title: analysis.jobDescription.title,
      company: analysis.jobDescription.company,
      requiredSkills: analysis.jobDescription.requiredSkills,
      preferredSkills: analysis.jobDescription.preferredSkills,
      responsibilities: analysis.jobDescription.responsibilities,
      qualifications: analysis.jobDescription.qualifications,
      experienceLevel: analysis.jobDescription.experienceLevel,
      keywords: analysis.jobDescription.keywords,
    };

    const scoringPromises: Promise<unknown>[] = [
      scoreATS(resumeData, jdData),
      scoreJobFit(resumeData, jdData),
    ];

    if (hasLinkedInData) {
      scoringPromises.push(
        checkConsistency(resumeData, {
          name: candidateLinkedIn!.name,
          headline: candidateLinkedIn!.headline,
          experience: candidateLinkedIn!.experience,
          skills: candidateLinkedIn!.skills,
        })
      );
    }

    const scoringResults = await Promise.allSettled(scoringPromises);

    const atsResult = scoringResults[0].status === 'fulfilled' ? scoringResults[0].value as { atsScore: number; breakdown: { keywordMatch: number; formatting: number; sectionStructure: number; parsability: number }; issues: unknown[] } : null;
    const jobFitResult = scoringResults[1].status === 'fulfilled' ? scoringResults[1].value as { jobFitScore: number; breakdown: { skillCoverage: number; experienceAlignment: number; seniorityMatch: number; industryRelevance: number }; missingSkills: string[]; strongMatches: string[]; recommendations: string[] } : null;
    const consistencyResult =
      hasLinkedInData && scoringResults[2]?.status === 'fulfilled'
        ? scoringResults[2].value as { consistencyScore: number; issues: unknown[] }
        : null;

    if (scoringResults[0].status === 'rejected') {
      console.error('[Pipeline] ATS scoring failed:', scoringResults[0].reason);
    }
    if (scoringResults[1].status === 'rejected') {
      console.error('[Pipeline] Job fit scoring failed:', scoringResults[1].reason);
    }
    if (hasLinkedInData && scoringResults[2]?.status === 'rejected') {
      console.error('[Pipeline] Consistency check failed:', (scoringResults[2] as PromiseRejectedResult).reason);
    }

    // Calculate overall score
    let overallScore = 0;
    if (hasLinkedInData && consistencyResult) {
      // Full weighting: ATS 35%, Job Fit 40%, Consistency 25%
      const atsScore = atsResult?.atsScore ?? 0;
      const jobFitScore = jobFitResult?.jobFitScore ?? 0;
      const consistencyScore = consistencyResult.consistencyScore ?? 0;
      overallScore = Math.round(
        atsScore * 0.35 + jobFitScore * 0.4 + consistencyScore * 0.25
      );
    } else {
      // No LinkedIn — adjust weights: ATS 45%, Job Fit 55%
      const atsScore = atsResult?.atsScore ?? 0;
      const jobFitScore = jobFitResult?.jobFitScore ?? 0;
      overallScore = Math.round(atsScore * 0.45 + jobFitScore * 0.55);
    }

    analysis.scores = {
      atsScore: atsResult?.atsScore ?? 0,
      atsBreakdown: atsResult?.breakdown ?? {
        keywordMatch: 0,
        formatting: 0,
        sectionStructure: 0,
        parsability: 0,
      },
      jobFitScore: jobFitResult?.jobFitScore ?? 0,
      jobFitBreakdown: jobFitResult?.breakdown ?? {
        skillCoverage: 0,
        experienceAlignment: 0,
        seniorityMatch: 0,
        industryRelevance: 0,
      },
      consistencyScore: consistencyResult?.consistencyScore ?? (hasLinkedInData ? 0 : 100),
      consistencyIssues: (consistencyResult?.issues as any[]) ?? [],
      overallScore,
    };

    await analysis.save();

    // ---------------------------------------------------------------
    // STEP 7: GENERATION (parallel)
    // ---------------------------------------------------------------
    analysis.status = 'generating';
    await analysis.save();

    // Fetch highlighted projects for resume rewriting context
    const highlightedProjects = await Project.find({
      userId: analysis.userId,
      isHighlighted: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const generationPromises = [
      rewriteResume({
        candidateName: analysis.candidate.name,
        resumeText: analysis.candidate.resumeText,
        experience: analysis.candidate.experience,
        skills: analysis.candidate.skills,
        education: analysis.candidate.education,
        jobTitle: analysis.jobDescription.title,
        requiredSkills: analysis.jobDescription.requiredSkills,
        keywords: analysis.jobDescription.keywords,
        projects: highlightedProjects.map((p) => ({
          title: p.title,
          description: p.description,
          techStack: p.techStack,
        })),
      }),
      buildPersona({
        targetName: analysis.target.name,
        targetHeadline: analysis.target.headline,
        targetCompany: analysis.target.company,
        targetIndustry: analysis.target.industry,
        targetSummary: analysis.target.summary,
        targetExperience: analysis.target.experience,
        targetPosts: analysis.target.recentPosts,
        targetSkills: analysis.target.skills,
      }),
      generateEmails({
        candidateName: analysis.candidate.name,
        candidateHeadline: analysis.candidate.headline,
        candidateSkills: analysis.candidate.skills,
        candidateExperience: analysis.candidate.experience,
        targetName: analysis.target.name,
        targetHeadline: analysis.target.headline,
        targetCompany: analysis.target.company,
        targetIndustry: analysis.target.industry,
        targetPosts: analysis.target.recentPosts,
        jobTitle: analysis.jobDescription.title,
        matchPoints: jobFitResult?.strongMatches ?? [],
        overallScore: analysis.scores?.overallScore ?? 0,
      }),
    ];

    const generationResults = await Promise.allSettled(generationPromises);

    if (generationResults[0].status === 'fulfilled') {
      analysis.optimizedResume = generationResults[0].value as any;
    } else {
      console.error('[Pipeline] Resume rewrite failed:', generationResults[0].reason);
    }

    if (generationResults[1].status === 'fulfilled') {
      analysis.recruiterPersona = generationResults[1].value as any;
    } else {
      console.error('[Pipeline] Persona build failed:', generationResults[1].reason);
    }

    if (generationResults[2].status === 'fulfilled') {
      const emailResult = generationResults[2].value as any;
      analysis.generatedEmails = emailResult.emails || emailResult;
    } else {
      console.error('[Pipeline] Email generation failed:', generationResults[2].reason);
    }

    await analysis.save();

    // ---------------------------------------------------------------
    // STEP 8: MODERATION CHECK
    // ---------------------------------------------------------------
    try {
      for (const email of analysis.generatedEmails) {
        const fullText = `${email.subject} ${email.body}`;
        if (containsInappropriateContent(fullText)) {
          await ModerationFlag.create({
            type: 'inappropriate_content',
            reason: 'automated_detection',
            description: `Auto-flagged generated email (tone: ${email.tone}) for analysis ${analysisId}. Content matched inappropriate language patterns.`,
            targetUserId: analysis.userId,
            targetResourceId: analysis._id,
            targetResourceType: 'Analysis',
            status: 'pending',
            autoFlagged: true,
          });
          break; // One flag per analysis is sufficient
        }
      }
    } catch (err) {
      console.error('[Pipeline] Moderation check failed:', err);
    }

    // ---------------------------------------------------------------
    // STEP 9: COMPLETE
    // ---------------------------------------------------------------
    analysis.status = 'complete';
    await analysis.save();

    await User.findByIdAndUpdate(analysis.userId, {
      lastActiveAt: new Date(),
    });
  } catch (err: any) {
    console.error(`[Pipeline] Fatal error for analysis ${analysisId}:`, err);
    analysis.status = 'failed';
    analysis.errorMessage = err.message || 'An unexpected error occurred during analysis.';
    await analysis.save();
  }
}
