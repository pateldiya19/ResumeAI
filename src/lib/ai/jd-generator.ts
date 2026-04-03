import { callClaudeJSON } from '@/lib/claude';
import { JD_GENERATOR } from './prompts';
import type { ParsedJobDescription } from '@/types/jd';

export interface GeneratedJobDescription extends ParsedJobDescription {
  rawText?: string;
}

export async function generateJobDescription(
  targetContext: Record<string, unknown>
): Promise<GeneratedJobDescription> {
  const userMessage = JSON.stringify({
    recruiterProfile: targetContext,
  });

  return callClaudeJSON<GeneratedJobDescription>(JD_GENERATOR, userMessage, {
    temperature: 0.5,
    maxTokens: 4096,
  });
}
