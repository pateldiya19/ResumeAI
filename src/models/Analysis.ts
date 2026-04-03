import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConsistencyIssue {
  type: 'date_mismatch' | 'missing_role' | 'skill_discrepancy' | 'title_mismatch' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  resumeValue?: string;
  linkedinValue?: string;
}

export interface IATSBreakdown {
  keywordMatch: number;
  formatting: number;
  sectionStructure: number;
  parsability: number;
}

export interface IJobFitBreakdown {
  skillCoverage: number;
  experienceAlignment: number;
  seniorityMatch: number;
  industryRelevance: number;
}

export interface IScores {
  atsScore: number;
  atsBreakdown: IATSBreakdown;
  jobFitScore: number;
  jobFitBreakdown: IJobFitBreakdown;
  consistencyScore: number;
  consistencyIssues: IConsistencyIssue[];
  overallScore: number;
}

export interface IOptimizedBullet {
  original: string;
  optimized: string;
  changes: string[];
  relevanceScore: number;
}

export interface IOptimizedResume {
  professionalSummary: string;
  bullets: IOptimizedBullet[];
  suggestedSkills: string[];
  formattingFixes: string[];
  keywordsAdded: string[];
}

export interface IRecruiterPersona {
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

export interface IEmailVariant {
  tone: 'professional' | 'conversational' | 'mutual_connection';
  subject: string;
  body: string;
  openingHook: string;
  matchPoints: string[];
  cta: string;
}

export interface IExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  duration: string;
  description: string;
  bullets: string[];
}

export interface IEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface ILinkedInExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ILinkedInPost {
  text: string;
  date: string;
  likes: number;
  comments: number;
}

export interface IAnalysis extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status:
    | 'pending'
    | 'scraping_candidate'
    | 'scraping_target'
    | 'parsing_jd'
    | 'analyzing'
    | 'generating'
    | 'complete'
    | 'failed';
  errorMessage?: string;
  candidate: {
    resumeFileName: string;
    resumeText: string;
    name: string;
    headline: string;
    summary: string;
    experience: IExperience[];
    education: IEducation[];
    skills: string[];
    certifications: string[];
    linkedinUrl?: string;
    linkedinData?: any;
  };
  target: {
    linkedinUrl: string;
    name: string;
    headline: string;
    company: string;
    companySize: string;
    industry: string;
    location: string;
    summary: string;
    experience: ILinkedInExperience[];
    recentPosts: ILinkedInPost[];
    skills: string[];
    connections: number;
    rawData?: any;
    scrapedEmail?: string;
  };
  jobDescription: {
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
  };
  scores?: IScores;
  optimizedResume?: IOptimizedResume;
  recruiterPersona?: IRecruiterPersona;
  generatedEmails: IEmailVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const ExperienceSchema = new Schema(
  {
    company: { type: String, default: '' },
    title: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    duration: { type: String, default: '' },
    description: { type: String, default: '' },
    bullets: [{ type: String }],
  },
  { _id: false }
);

const EducationSchema = new Schema(
  {
    institution: { type: String, default: '' },
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    gpa: { type: String, default: undefined },
  },
  { _id: false }
);

const LinkedInExperienceSchema = new Schema(
  {
    company: { type: String, default: '' },
    title: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const LinkedInPostSchema = new Schema(
  {
    text: { type: String, default: '' },
    date: { type: String, default: '' },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
  },
  { _id: false }
);

const ConsistencyIssueSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['date_mismatch', 'missing_role', 'skill_discrepancy', 'title_mismatch', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    resumeValue: { type: String, default: undefined },
    linkedinValue: { type: String, default: undefined },
  },
  { _id: false }
);

const OptimizedBulletSchema = new Schema(
  {
    original: { type: String, required: true },
    optimized: { type: String, required: true },
    changes: [{ type: String }],
    relevanceScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const EmailVariantSchema = new Schema(
  {
    tone: {
      type: String,
      enum: ['professional', 'conversational', 'mutual_connection'],
      required: true,
    },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    openingHook: { type: String, default: '' },
    matchPoints: [{ type: String }],
    cta: { type: String, default: '' },
  },
  { _id: false }
);

const AnalysisSchema = new Schema<IAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'scraping_candidate',
        'scraping_target',
        'parsing_jd',
        'analyzing',
        'generating',
        'complete',
        'failed',
      ],
      default: 'pending',
      required: true,
    },
    errorMessage: {
      type: String,
      default: undefined,
    },
    candidate: {
      resumeFileName: { type: String, default: '' },
      resumeText: { type: String, default: '' },
      name: { type: String, default: '' },
      headline: { type: String, default: '' },
      summary: { type: String, default: '' },
      experience: [ExperienceSchema],
      education: [EducationSchema],
      skills: [{ type: String }],
      certifications: [{ type: String }],
      linkedinUrl: { type: String, default: undefined },
      linkedinData: { type: Schema.Types.Mixed, default: undefined },
    },
    target: {
      linkedinUrl: { type: String, required: [true, 'Target LinkedIn URL is required'] },
      name: { type: String, default: '' },
      headline: { type: String, default: '' },
      company: { type: String, default: '' },
      companySize: { type: String, default: '' },
      industry: { type: String, default: '' },
      location: { type: String, default: '' },
      summary: { type: String, default: '' },
      experience: [LinkedInExperienceSchema],
      recentPosts: [LinkedInPostSchema],
      skills: [{ type: String }],
      connections: { type: Number, default: 0 },
      rawData: { type: Schema.Types.Mixed, default: undefined },
      scrapedEmail: { type: String, default: undefined },
    },
    jobDescription: {
      source: {
        type: String,
        enum: ['user_provided', 'ai_generated'],
        default: 'user_provided',
      },
      rawText: { type: String, default: '' },
      title: { type: String, default: '' },
      company: { type: String, default: '' },
      requiredSkills: [{ type: String }],
      preferredSkills: [{ type: String }],
      responsibilities: [{ type: String }],
      qualifications: [{ type: String }],
      experienceLevel: { type: String, default: '' },
      keywords: [{ type: String }],
    },
    scores: {
      atsScore: { type: Number, min: 0, max: 100 },
      atsBreakdown: {
        keywordMatch: { type: Number, min: 0, max: 100 },
        formatting: { type: Number, min: 0, max: 100 },
        sectionStructure: { type: Number, min: 0, max: 100 },
        parsability: { type: Number, min: 0, max: 100 },
      },
      jobFitScore: { type: Number, min: 0, max: 100 },
      jobFitBreakdown: {
        skillCoverage: { type: Number, min: 0, max: 100 },
        experienceAlignment: { type: Number, min: 0, max: 100 },
        seniorityMatch: { type: Number, min: 0, max: 100 },
        industryRelevance: { type: Number, min: 0, max: 100 },
      },
      consistencyScore: { type: Number, min: 0, max: 100 },
      consistencyIssues: [ConsistencyIssueSchema],
      overallScore: { type: Number, min: 0, max: 100 },
    },
    optimizedResume: {
      professionalSummary: { type: String },
      bullets: [OptimizedBulletSchema],
      suggestedSkills: [{ type: String }],
      formattingFixes: [{ type: String }],
      keywordsAdded: [{ type: String }],
    },
    recruiterPersona: {
      name: { type: String },
      headline: { type: String },
      company: { type: String },
      communicationStyle: {
        type: String,
        enum: ['formal', 'casual', 'mixed'],
      },
      priorities: [{ type: String }],
      painPoints: [{ type: String }],
      recentTopics: [{ type: String }],
      recommendedApproach: { type: String },
      culturalSignals: [{ type: String }],
    },
    generatedEmails: [EmailVariantSchema],
  },
  {
    timestamps: true,
  }
);

AnalysisSchema.index({ userId: 1, createdAt: -1 });
AnalysisSchema.index({ status: 1 });
AnalysisSchema.index({ 'scores.overallScore': -1 });

const Analysis: Model<IAnalysis> =
  mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);

export default Analysis;
