export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeDef {
  id: string; name: string; description: string; icon: string; tier: BadgeTier;
  condition: (user: Record<string, unknown>, stats: Record<string, number>) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: 'first_upload', name: 'Getting Started', description: 'Uploaded your first resume', icon: '🚀', tier: 'bronze',
    condition: (u) => u.onboardingComplete === true },
  { id: 'first_analysis', name: 'First Check', description: 'Completed your first analysis', icon: '🔍', tier: 'bronze',
    condition: (_, s) => (s.totalAnalyses ?? 0) >= 1 },
  { id: 'ats_above_60', name: 'Passing Grade', description: 'ATS score above 60', icon: '📊', tier: 'silver',
    condition: (u) => ((u.profileAnalysis as Record<string, unknown>)?.ats_score as number ?? 0) >= 60 },
  { id: 'ats_above_80', name: 'ATS Master', description: 'ATS score above 80', icon: '⭐', tier: 'gold',
    condition: (u) => ((u.profileAnalysis as Record<string, unknown>)?.ats_score as number ?? 0) >= 80 },
  { id: 'five_analyses', name: 'Dedicated Seeker', description: 'Completed 5 analyses', icon: '🎯', tier: 'silver',
    condition: (_, s) => (s.totalAnalyses ?? 0) >= 5 },
  { id: 'first_email', name: 'Outreach Pro', description: 'Sent your first cold email', icon: '📧', tier: 'silver',
    condition: (_, s) => (s.totalEmails ?? 0) >= 1 },
  { id: 'five_emails', name: 'Networking Beast', description: 'Sent 5 cold emails', icon: '🔥', tier: 'gold',
    condition: (_, s) => (s.totalEmails ?? 0) >= 5 },
  { id: 'linkedin_connected', name: 'Connected', description: 'Linked your LinkedIn', icon: '🔗', tier: 'bronze',
    condition: (u) => !!u.linkedinUrl },
  { id: 'chat_used', name: 'AI Coached', description: 'Used the AI Career Coach', icon: '💬', tier: 'bronze',
    condition: (_, s) => (s.chatMessages ?? 0) >= 1 },
  { id: 'editor_used', name: 'Editor Pro', description: 'Used the Live Resume Editor', icon: '✏️', tier: 'bronze',
    condition: (u) => !!u.resumeText && (u.resumeText as string).length > 200 },
  { id: 'perfect_resume', name: 'Perfectionist', description: 'ATS score above 90', icon: '💎', tier: 'platinum',
    condition: (u) => ((u.profileAnalysis as Record<string, unknown>)?.ats_score as number ?? 0) >= 90 },
  { id: 'project_added', name: 'Portfolio Builder', description: 'Added a project', icon: '📁', tier: 'bronze',
    condition: (_, s) => (s.totalProjects ?? 0) >= 1 },
];

export const TIER_COLORS: Record<BadgeTier, { bg: string; ring: string; text: string }> = {
  bronze: { bg: 'bg-amber-100', ring: 'ring-amber-300', text: 'text-amber-700' },
  silver: { bg: 'bg-gray-100', ring: 'ring-gray-300', text: 'text-gray-600' },
  gold: { bg: 'bg-yellow-100', ring: 'ring-yellow-400', text: 'text-yellow-700' },
  platinum: { bg: 'bg-purple-100', ring: 'ring-purple-400', text: 'text-purple-700' },
};
