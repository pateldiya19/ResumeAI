export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  duration: string;
  description: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface CandidateProfile {
  name: string;
  headline: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: string[];
}

export interface ParsedResume {
  rawText: string;
  fileName: string;
  fileType: 'pdf' | 'docx';
}

export interface ResumeData extends CandidateProfile {
  resumeFileName: string;
  resumeText: string;
  linkedinUrl?: string;
}
