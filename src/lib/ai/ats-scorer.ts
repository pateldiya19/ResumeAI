import { callGPTJSON } from '@/lib/openai';
import { ATS_SCORER } from './prompts';

export interface ATSIssue {
  issue: string;
  severity: 'low' | 'medium' | 'high';
  fix: string;
}

export interface ATSBreakdown {
  keywordMatch: number;
  formatting: number;
  sectionStructure: number;
  parsability: number;
}

export interface ATSResult {
  atsScore: number;
  breakdown: ATSBreakdown;
  issues: ATSIssue[];
}

export async function scoreATS(
  resumeData: Record<string, unknown>,
  jobDescription: Record<string, unknown>
): Promise<ATSResult> {
  const userMessage = JSON.stringify({
    resume: resumeData,
    jobDescription,
  });

  return callGPTJSON<ATSResult>(ATS_SCORER, userMessage, {
    temperature: 0.3,
    maxTokens: 4096,
  });
}
