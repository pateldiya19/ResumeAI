const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN!;
const APIFY_ACTOR_ID = '2SyF0bVxmgGr8IVCZ'; // dev_fusion/Linkedin-Profile-Scraper
const APIFY_BASE_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items`;
const REQUEST_TIMEOUT_MS = 90_000;

function normalizeLinkedInUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  normalized = normalized.replace(/\/+$/, '');
  const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i;
  if (!linkedInPattern.test(normalized)) {
    throw new Error(`Invalid LinkedIn profile URL: ${url}`);
  }
  return normalized;
}

export async function scrapeLinkedInProfile(profileUrl: string): Promise<any> {
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN not set');
  }

  const normalizedUrl = normalizeLinkedInUrl(profileUrl);
  console.log(`[Apify] Scraping: ${normalizedUrl}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${APIFY_BASE_URL}?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUrls: [normalizedUrl] }),
        signal: controller.signal,
      }
    );

    if (response.status === 429) {
      throw new Error('Apify rate limit exceeded. Try again shortly.');
    }
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Apify error (${response.status}): ${errorBody.slice(0, 200)}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No profile data returned. Profile may be private.');
    }

    const profile = data[0];
    console.log(`[Apify] Got profile: ${profile.fullName || profile.firstName || 'unknown'}, email: ${profile.email ? 'YES' : 'NO'}`);
    return profile;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('LinkedIn scraping timed out after 90s.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function findEmailByLinkedIn(profileUrl: string): Promise<string | null> {
  try {
    const profile = await scrapeLinkedInProfile(profileUrl);
    return profile.email || null;
  } catch {
    return null;
  }
}
