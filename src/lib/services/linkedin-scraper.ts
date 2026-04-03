import { scrapeLinkedInProfile, findEmailByLinkedIn } from '@/lib/apify';
import { normalizeLinkedInProfile } from '@/lib/parsers/linkedin-normalizer';
import { NormalizedLinkedInProfile } from '@/types/linkedin';

const LINKEDIN_URL_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i;

function isValidLinkedInUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  return LINKEDIN_URL_PATTERN.test(normalized);
}

export async function scrapeAndNormalizeProfile(
  profileUrl: string
): Promise<NormalizedLinkedInProfile | null> {
  if (!isValidLinkedInUrl(profileUrl)) {
    console.error(`[LinkedInScraper] Invalid LinkedIn URL: ${profileUrl}`);
    return null;
  }

  try {
    const rawProfile = await scrapeLinkedInProfile(profileUrl);

    if (!rawProfile || typeof rawProfile !== 'object') {
      console.error('[LinkedInScraper] Scraping returned empty or invalid data');
      return null;
    }

    const normalized = normalizeLinkedInProfile(rawProfile);
    return normalized;
  } catch (err) {
    console.error('[LinkedInScraper] Failed to scrape and normalize profile:', err);
    return null;
  }
}

export async function scrapeTargetWithEmail(
  profileUrl: string
): Promise<{ profile: NormalizedLinkedInProfile | null; email: string | null }> {
  if (!isValidLinkedInUrl(profileUrl)) {
    console.error(`[LinkedInScraper] Invalid LinkedIn URL: ${profileUrl}`);
    return { profile: null, email: null };
  }

  const [profile, email] = await Promise.allSettled([
    scrapeAndNormalizeProfile(profileUrl),
    findEmailByLinkedIn(profileUrl),
  ]);

  return {
    profile: profile.status === 'fulfilled' ? profile.value : null,
    email: email.status === 'fulfilled' ? email.value : null,
  };
}
