import { callGPTJSON } from '@/lib/openai';
import { JD_PARSER } from '@/lib/ai/prompts';
import { ParsedJobDescription } from '@/types/jd';

export async function parseJobDescription(
  rawText: string
): Promise<ParsedJobDescription> {
  if (!rawText || rawText.trim().length < 20) {
    throw new Error(
      'Job description text is too short. Please provide a complete job description.'
    );
  }

  const parsed = await callGPTJSON<Record<string, unknown>>(
    JD_PARSER,
    rawText.trim()
  );

  return {
    title: (parsed.title as string) || '',
    company: (parsed.company as string) || '',
    requiredSkills: Array.isArray(parsed.requiredSkills)
      ? parsed.requiredSkills
      : Array.isArray(parsed.skills)
        ? parsed.skills
        : [],
    preferredSkills: Array.isArray(parsed.preferredSkills)
      ? parsed.preferredSkills
      : Array.isArray(parsed.preferredQualifications)
        ? parsed.preferredQualifications
        : [],
    responsibilities: Array.isArray(parsed.responsibilities)
      ? parsed.responsibilities
      : [],
    qualifications: Array.isArray(parsed.qualifications)
      ? parsed.qualifications
      : Array.isArray(parsed.requirements)
        ? parsed.requirements
        : [],
    experienceLevel: (parsed.experienceLevel as string) || '',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
  };
}
