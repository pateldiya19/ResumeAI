export interface LinkedInExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface LinkedInPost {
  text: string;
  date: string;
  likes: number;
  comments: number;
}

export interface LinkedInProfile {
  name: string;
  headline: string;
  company: string;
  companySize: string;
  industry: string;
  location: string;
  summary: string;
  experience: LinkedInExperience[];
  recentPosts: LinkedInPost[];
  skills: string[];
  connections: number;
}

export interface ApifyLinkedInResult {
  [key: string]: any;
}

export interface NormalizedLinkedInProfile extends LinkedInProfile {
  profileUrl: string;
}
