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
  isFavorite?: boolean;
}

// ── Mode 1: Resume-Only Analysis ──
export interface Mode1Results {
  ats_score: number;
  ats_label: 'Needs Work' | 'Good' | 'Strong';
  formatting_issues: Array<{ type: 'warning' | 'error'; message: string }>;
  missing_sections: string[];
  weak_bullets: Array<{ original: string; suggestion: string }>;
  section_scores: {
    contact_info: number;
    formatting: number;
    action_verbs: number;
    quantification: number;
    section_structure: number;
  };
  overall_verdict: 'Needs Work' | 'Good' | 'Strong';
}

// ── Mode 2: Job-Specific Analysis ──
export interface Mode2Results {
  job_match_score: number;
  fit_verdict: 'Low Fit' | 'Moderate Fit' | 'Strong Fit';
  ats_score: number;
  ats_label: 'Needs Work' | 'Good' | 'Strong';
  matched_skills: string[];
  missing_skills: string[];
  keyword_matches: {
    found: string[];
    missing: string[];
  };
  resume_improvements: string[];
  section_scores: {
    keyword_match: number;
    skill_coverage: number;
    experience_relevance: number;
    formatting: number;
  };
  weak_bullets: Array<{ original: string; suggestion: string }>;
  radar_scores: {
    technical_skills: number;
    experience_level: number;
    industry_match: number;
    keyword_coverage: number;
    education_fit: number;
    soft_skills: number;
  };
}

// ── Analysis Mode ──
export type AnalysisMode = 'resume_only' | 'job_analysis' | 'full_application';

export interface AnalysisResponse {
  _id: string;
  mode?: AnalysisMode;
  status: AnalysisStatus;
  errorMessage?: string;
  candidate: any;
  target: any;
  jobDescription: any;
  scores: Scores | null;
  optimizedResume: OptimizedResume | null;
  recruiterPersona: RecruiterPersona | null;
  generatedEmails: EmailVariant[];
  canSendEmail: boolean;
  mode1Results?: Mode1Results | null;
  mode2Results?: Mode2Results | null;
  createdAt: string;
  updatedAt: string;
}
