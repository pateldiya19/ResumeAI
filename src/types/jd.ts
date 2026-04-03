export interface JobDescription {
  source: 'user_provided' | 'ai_generated';
  rawText: string;
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  experienceLevel: string;
  keywords: string[];
}

export interface ParsedJobDescription {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  experienceLevel: string;
  keywords: string[];
}
