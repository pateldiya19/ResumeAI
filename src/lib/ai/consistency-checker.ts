import { callGPTJSON } from '@/lib/openai';
import { CONSISTENCY_CHECKER } from './prompts';
import type { NormalizedLinkedInProfile } from '@/types/linkedin';

export interface ConsistencyIssue {
  type:
    | 'date_mismatch'
    | 'title_mismatch'
    | 'company_mismatch'
    | 'education_mismatch'
    | 'missing_role'
    | 'skill_discrepancy'
    | 'accomplishment_discrepancy'
    | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resumeValue: string;
  linkedinValue: string;
  recommendation: string;
}

export interface ConsistencyResult {
  consistencyScore: number;
  issues: ConsistencyIssue[];
}

export async function checkConsistency(
  resumeData: Record<string, unknown>,
  linkedInProfile: Record<string, unknown>
): Promise<ConsistencyResult> {
  const userMessage = JSON.stringify({
    resume: resumeData,
    linkedInProfile,
  });

  return callGPTJSON<ConsistencyResult>(CONSISTENCY_CHECKER, userMessage, {
    temperature: 0.3,
    maxTokens: 4096,
  });
}
