const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN!;
const APIFY_ACTOR_ID = '2SyF0bVxmgGr8IVCZ';
const APIFY_BASE_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items`;
const REQUEST_TIMEOUT_MS = 60_000;

function normalizeLinkedInUrl(url: string): string {
  let normalized = url.trim();

  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, '');

  const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i;
  if (!linkedInPattern.test(normalized)) {
    throw new Error(
      `Invalid LinkedIn profile URL: ${url}. Expected format: https://www.linkedin.com/in/username`
    );
  }

  return normalized;
}

export async function scrapeLinkedInProfile(profileUrl: string): Promise<any> {
  if (!APIFY_API_TOKEN) {
    throw new Error('Please define the APIFY_API_TOKEN environment variable');
  }

  const normalizedUrl = normalizeLinkedInUrl(profileUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${APIFY_BASE_URL}?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrls: [normalizedUrl],
        }),
        signal: controller.signal,
      }
    );

    if (response.status === 429) {
      throw new Error(
        'Apify rate limit exceeded. Please wait a moment and try again.'
      );
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Apify API error (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        'No profile data returned. The LinkedIn profile may be private or the URL may be incorrect.'
      );
    }

    return data[0];
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(
        'LinkedIn profile scraping timed out after 60 seconds. Please try again.'
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function findEmailByLinkedIn(
  profileUrl: string
): Promise<string | null> {
  try {
    const profileData = await scrapeLinkedInProfile(profileUrl);

    if (profileData.email && typeof profileData.email === 'string') {
      return profileData.email;
    }

    if (
      profileData.emailAddress &&
      typeof profileData.emailAddress === 'string'
    ) {
      return profileData.emailAddress;
    }

    if (Array.isArray(profileData.emails) && profileData.emails.length > 0) {
      const firstEmail = profileData.emails[0];
      return typeof firstEmail === 'string' ? firstEmail : firstEmail.email || null;
    }

    if (profileData.contactInfo?.email) {
      return profileData.contactInfo.email;
    }

    return null;
  } catch (error) {
    console.error('Error finding email from LinkedIn profile:', error);
    return null;
  }
}
