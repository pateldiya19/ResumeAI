import {
  NormalizedLinkedInProfile,
  LinkedInExperience,
  LinkedInPost,
} from '@/types/linkedin';

function buildName(raw: any): string {
  if (raw.fullName) return raw.fullName.trim();
  const first = raw.firstName || '';
  const last = raw.lastName || '';
  return `${first} ${last}`.trim() || 'Unknown';
}

function mapExperience(raw: any): LinkedInExperience[] {
  const experiences: LinkedInExperience[] = [];

  // dev_fusion actor puts current job in top-level fields
  if (raw.jobTitle || raw.companyName) {
    experiences.push({
      title: raw.jobTitle || '',
      company: raw.companyName || '',
      location: raw.jobLocation || '',
      startDate: raw.jobStartedOn || '',
      endDate: raw.jobStillWorking ? 'Present' : '',
      description: '',
      isCurrent: true,
    });
  }

  // Also check positions array (some actors use this)
  if (Array.isArray(raw.positions)) {
    for (const pos of raw.positions) {
      experiences.push({
        title: pos.title || pos.jobTitle || '',
        company: pos.companyName || pos.company?.name || pos.company || '',
        location: pos.location || pos.locationName || '',
        startDate: pos.startDate
          ? typeof pos.startDate === 'string' ? pos.startDate : `${pos.startDate.month || ''}/${pos.startDate.year || ''}`
          : '',
        endDate: pos.endDate
          ? typeof pos.endDate === 'string' ? pos.endDate : `${pos.endDate.month || ''}/${pos.endDate.year || ''}`
          : '',
        description: pos.description || pos.summary || '',
        isCurrent: Boolean(pos.isCurrent),
      });
    }
  }

  // Also check experience array
  if (Array.isArray(raw.experience)) {
    for (const exp of raw.experience) {
      experiences.push({
        title: exp.title || exp.jobTitle || '',
        company: exp.companyName || exp.company || '',
        location: exp.location || '',
        startDate: exp.startDate || exp.start || '',
        endDate: exp.endDate || exp.end || '',
        description: exp.description || '',
        isCurrent: Boolean(exp.isCurrent),
      });
    }
  }

  return experiences;
}

function mapPosts(posts: any[]): LinkedInPost[] {
  if (!Array.isArray(posts)) return [];
  return posts.map((post: any) => ({
    text: post.text || post.commentary || post.content || '',
    date: post.date || post.postedAt || post.publishedAt || '',
    likes: Number(post.likes || post.numLikes || post.likeCount || 0),
    comments: Number(post.comments || post.numComments || post.commentCount || 0),
    shares: Number(post.shares || post.numShares || post.shareCount || 0),
  }));
}

export function normalizeLinkedInProfile(raw: any): NormalizedLinkedInProfile {
  if (!raw || typeof raw !== 'object') {
    return {
      name: 'Unknown', headline: '', company: '', companySize: '',
      industry: '', location: '', summary: '', experience: [],
      recentPosts: [], skills: [], connections: 0, profileUrl: '',
    };
  }

  // Skills — handle array of strings or objects
  const skills: string[] = Array.isArray(raw.skills)
    ? raw.skills.map((s: any) => typeof s === 'string' ? s : s.name || s.skill || String(s))
    : [];

  return {
    name: buildName(raw),
    headline: raw.headline || raw.jobTitle || '',
    company: raw.companyName || raw.company?.name || '',
    companySize: raw.companySize || raw.company?.employeeCount || '',
    industry: raw.companyIndustry || raw.industry || '',
    location: raw.jobLocation || raw.location || raw.addressLocality || '',
    summary: raw.summary || raw.about || '',
    experience: mapExperience(raw),
    recentPosts: mapPosts(raw.posts || raw.recentPosts || []),
    skills,
    connections: Number(raw.connections || raw.connectionsCount || raw.numConnections || 0),
    profileUrl: raw.linkedinUrl || raw.url || raw.profileUrl || '',
  };
}
