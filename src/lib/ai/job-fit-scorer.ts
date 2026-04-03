import { callClaudeJSON } from '@/lib/claude';
import { JOB_FIT_SCORER } from './prompts';

export interface JobFitBreakdown {
  skillCoverage: number;
  experienceAlignment: number;
  seniorityMatch: number;
  industryRelevance: number;
}

export interface JobFitResult {
  jobFitScore: number;
  breakdown: JobFitBreakdown;
  missingSkills: string[];
  strongMatches: string[];
  recommendations: string[];
}

export async function scoreJobFit(
  resumeData: Record<string, unknown>,
  jobDescription: Record<string, unknown>
): Promise<JobFitResult> {
  const userMessage = JSON.stringify({
    resume: resumeData,
    jobDescription,
  });

  return callClaudeJSON<JobFitResult>(JOB_FIT_SCORER, userMessage, {
    temperature: 0.3,
    maxTokens: 4096,
  });
}
