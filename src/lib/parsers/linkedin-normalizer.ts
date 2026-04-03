import {
  NormalizedLinkedInProfile,
  LinkedInExperience,
  LinkedInPost,
} from '@/types/linkedin';

function buildName(raw: any): string {
  if (raw.fullName && typeof raw.fullName === 'string') {
    return raw.fullName.trim();
  }

  const first = raw.firstName || '';
  const last = raw.lastName || '';
  const combined = `${first} ${last}`.trim();

  return combined || 'Unknown';
}

function mapExperience(positions: any[]): LinkedInExperience[] {
  if (!Array.isArray(positions)) return [];

  return positions.map((pos: any) => ({
    title: pos.title || pos.jobTitle || '',
    company: pos.companyName || pos.company?.name || pos.company || '',
    location: pos.location || pos.locationName || '',
    startDate: pos.startDate
      ? typeof pos.startDate === 'string'
        ? pos.startDate
        : `${pos.startDate.month || ''}/${pos.startDate.year || ''}`
      : '',
    endDate: pos.endDate
      ? typeof pos.endDate === 'string'
        ? pos.endDate
        : `${pos.endDate.month || ''}/${pos.endDate.year || ''}`
      : '',
    description: pos.description || pos.summary || '',
    isCurrent: Boolean(
      pos.isCurrent ?? (pos.timePeriod?.endDate === undefined)
    ),
  }));
}

function mapPosts(posts: any[]): LinkedInPost[] {
  if (!Array.isArray(posts)) return [];

  return posts.map((post: any) => ({
    text: post.text || post.commentary || post.content || '',
    date: post.date || post.postedAt || post.publishedAt || '',
    likes: Number(post.likes || post.numLikes || post.likeCount || 0),
    comments: Number(
      post.comments || post.numComments || post.commentCount || 0
    ),
    shares: Number(post.shares || post.numShares || post.shareCount || 0),
  }));
}

export function normalizeLinkedInProfile(raw: any): NormalizedLinkedInProfile {
  if (!raw || typeof raw !== 'object') {
    return {
      name: 'Unknown',
      headline: '',
      company: '',
      companySize: '',
      industry: '',
      location: '',
      summary: '',
      experience: [],
      recentPosts: [],
      skills: [],
      connections: 0,
      profileUrl: '',
    };
  }

  const skills: string[] = Array.isArray(raw.skills)
    ? raw.skills.map((s: any) =>
        typeof s === 'string' ? s : s.name || s.skill || String(s)
      )
    : [];

  return {
    name: buildName(raw),
    headline: raw.headline || '',
    company:
      raw.company?.name ||
      (Array.isArray(raw.positions) && raw.positions.length > 0
        ? raw.positions[0].companyName || raw.positions[0].company?.name || ''
        : ''),
    companySize:
      raw.company?.employeeCount ||
      raw.company?.staffCount ||
      (typeof raw.companySize === 'string' || typeof raw.companySize === 'number'
        ? String(raw.companySize)
        : ''),
    industry: raw.industry || '',
    location: raw.location || raw.addressLocality || raw.geo?.full || '',
    summary: raw.summary || raw.about || '',
    experience: mapExperience(raw.positions || raw.experience || []),
    recentPosts: mapPosts(raw.posts || raw.recentPosts || []),
    skills,
    connections: Number(
      raw.connectionsCount || raw.connections || raw.numConnections || 0
    ),
    profileUrl: raw.url || raw.profileUrl || raw.linkedInUrl || '',
  };
}
