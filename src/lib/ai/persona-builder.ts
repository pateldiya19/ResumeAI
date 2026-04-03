import { callClaudeJSON } from '@/lib/claude';
import { PERSONA_BUILDER } from './prompts';
import type { NormalizedLinkedInProfile } from '@/types/linkedin';

export interface RecruiterPersona {
  name: string;
  headline: string;
  company: string;
  communicationStyle: string;
  priorities: string[];
  painPoints: string[];
  recentTopics: string[];
  recommendedApproach: string;
  culturalSignals: string[];
  responselikelihood: string;
  bestContactMethod: string;
  commonGround: string[];
}

export async function buildPersona(
  targetProfile: Record<string, unknown>
): Promise<RecruiterPersona> {
  const userMessage = JSON.stringify({
    linkedInProfile: targetProfile,
  });

  return callClaudeJSON<RecruiterPersona>(PERSONA_BUILDER, userMessage, {
    temperature: 0.7,
    maxTokens: 4096,
  });
}
