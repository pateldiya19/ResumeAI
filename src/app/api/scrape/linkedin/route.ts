import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { scrapeLinkedInProfile } from '@/lib/apify';
import { normalizeLinkedInProfile } from '@/lib/parsers/linkedin-normalizer';

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Global rate limit for Apify calls
  const { allowed } = rateLimit('apify:global', 10, 60000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Scraping rate limit reached. Try again shortly.' },
      { status: 429 }
    );
  }

  const { linkedinUrl } = await req.json();
  if (
    !linkedinUrl ||
    typeof linkedinUrl !== 'string' ||
    !linkedinUrl.includes('linkedin.com')
  ) {
    return NextResponse.json({ error: 'Invalid LinkedIn URL' }, { status: 400 });
  }

  try {
    const rawData = await scrapeLinkedInProfile(linkedinUrl);
    const normalized = normalizeLinkedInProfile(rawData);
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('[scrape/linkedin] Scraping failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape LinkedIn profile' },
      { status: 500 }
    );
  }
}
