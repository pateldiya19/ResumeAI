import { callClaudeJSON } from '@/lib/claude';
import { EMAIL_GENERATOR } from './prompts';
import type { RecruiterPersona } from './persona-builder';

export interface EmailVariant {
  tone: 'professional' | 'conversational' | 'mutual_connection';
  subject: string;
  body: string;
  openingHook: string;
  matchPoints: string[];
  cta: string;
}

export interface EmailGenerationResult {
  emails: EmailVariant[];
}

export async function generateEmails(
  context: Record<string, unknown>
): Promise<EmailGenerationResult> {
  const userMessage = JSON.stringify(context);

  return callClaudeJSON<EmailGenerationResult>(EMAIL_GENERATOR, userMessage, {
    temperature: 0.7,
    maxTokens: 4096,
  });
}
