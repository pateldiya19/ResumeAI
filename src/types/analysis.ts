export type AnalysisStatus =
  | 'pending'
  | 'scraping_candidate'
  | 'scraping_target'
  | 'parsing_jd'
  | 'analyzing'
  | 'generating'
  | 'complete'
  | 'failed';

export interface ATSBreakdown {
  keywordMatch: number;
  formatting: number;
  sectionStructure: number;
  parsability: number;
}

export interface JobFitBreakdown {
  skillCoverage: number;
  experienceAlignment: number;
  seniorityMatch: number;
  industryRelevance: number;
}

export interface ConsistencyIssue {
  type:
    | 'date_mismatch'
    | 'missing_role'
    | 'skill_discrepancy'
    | 'title_mismatch'
    | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  resumeValue?: string;
  linkedinValue?: string;
}

export interface Scores {
  atsScore: number;
  atsBreakdown: ATSBreakdown;
  jobFitScore: number;
  jobFitBreakdown: JobFitBreakdown;
  consistencyScore: number;
  consistencyIssues: ConsistencyIssue[];
  overallScore: number;
}

export interface OptimizedBullet {
  original: string;
  optimized: string;
  changes: string[];
  relevanceScore: number;
}

export interface OptimizedResume {
  professionalSummary: string;
  bullets: OptimizedBullet[];
  suggestedSkills: string[];
  formattingFixes: string[];
  keywordsAdded: string[];
}

export interface RecruiterPersona {
  name: string;
  headline: string;
  company: string;
  communicationStyle: 'formal' | 'casual' | 'mixed';
  priorities: string[];
  painPoints: string[];
  recentTopics: string[];
  recommendedApproach: string;
  culturalSignals: string[];
}

export type EmailTone = 'professional' | 'conversational' | 'mutual_connection';

export interface EmailVariant {
  tone: EmailTone;
  subject: string;
  body: string;
  openingHook: string;
  matchPoints: string[];
  cta: string;
}

export interface AnalysisResponse {
  _id: string;
  status: AnalysisStatus;
  candidate: any;
  target: any;
  jobDescription: any;
  scores: Scores | null;
  optimizedResume: OptimizedResume | null;
  recruiterPersona: RecruiterPersona | null;
  generatedEmails: EmailVariant[];
  canSendEmail: boolean;
  createdAt: string;
  updatedAt: string;
}
