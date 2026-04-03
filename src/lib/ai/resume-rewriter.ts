import { callGPTJSON } from '@/lib/openai';
import { RESUME_REWRITER } from './prompts';

export interface RewrittenBullet {
  original: string;
  optimized: string;
  changes: string[];
  relevanceScore: number;
}

export interface RewriteResult {
  professionalSummary: string;
  bullets: RewrittenBullet[];
  suggestedSkills: string[];
  formattingFixes: string[];
  keywordsAdded: string[];
}

export async function rewriteResume(
  context: Record<string, unknown>
): Promise<RewriteResult> {
  const userMessage = JSON.stringify(context);

  return callGPTJSON<RewriteResult>(RESUME_REWRITER, userMessage, {
    temperature: 0.7,
    maxTokens: 4096,
  });
}
