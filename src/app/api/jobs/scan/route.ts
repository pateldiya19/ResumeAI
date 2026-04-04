import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { scoreJobMatch } from '@/lib/jobs/skill-matcher';
import { rateLimit } from '@/lib/utils/rate-limiter';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;
const INDEED_ACTOR = 'MXLpngmVpE8WTESQr';
const NAUKRI_ACTOR = 'EYXvM0o2lS7rYzgey';

async function scrapeJobs(actorId: string, input: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input), signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Apify error: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') throw new Error('Job scraping timed out');
    throw err;
  } finally { clearTimeout(timeout); }
}

function normalizeJob(raw: Record<string, unknown>, source: string) {
  return {
    id: `${source}_${String(raw.id || raw.jobId || raw.url || Math.random()).slice(0, 20)}`,
    title: String(raw.title || raw.jobTitle || raw.positionName || ''),
    company: String(raw.company || raw.companyName || raw.companyname || ''),
    location: String(raw.location || raw.jobLocation || ''),
    salary: String(raw.salary || raw.salaryRange || raw.salaryText || ''),
    description: String(raw.description || raw.jobDescription || raw.snippet || ''),
    url: String(raw.url || raw.jobUrl || raw.link || ''),
    postedDate: String(raw.postedAt || raw.date || raw.postedDate || raw.createdAt || ''),
    source,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { allowed } = rateLimit(`jobs:${session.user.id}`, 3, 60000);
    if (!allowed) return NextResponse.json({ error: 'Rate limited. Try again in a minute.' }, { status: 429 });

    await connectDB();
    const user = await User.findById(session.user.id).select('parsedResume');
    const userSkills: string[] = (user?.parsedResume as Record<string, unknown>)?.skills as string[] || [];

    const { query, location, source } = await req.json() as { query: string; location: string; source: string };
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    let jobs: ReturnType<typeof normalizeJob>[] = [];

    if (source === 'indeed' || source === 'both') {
      try {
        const raw = await scrapeJobs(INDEED_ACTOR, { query, location: location || '', maxResults: 15, sort: 'date' });
        jobs.push(...raw.map(r => normalizeJob(r, 'indeed')));
      } catch (err) { console.error('[Jobs] Indeed scrape failed:', err); }
    }

    if (source === 'naukri' || source === 'both') {
      try {
        const raw = await scrapeJobs(NAUKRI_ACTOR, { keyword: query, location: location || '', maxItems: 15 });
        jobs.push(...raw.map(r => normalizeJob(r, 'naukri')));
      } catch (err) { console.error('[Jobs] Naukri scrape failed:', err); }
    }

    // Score each job against user's skills
    const scored = jobs
      .filter(j => j.title && j.company)
      .map(j => {
        const match = scoreJobMatch(userSkills, j.description || j.title);
        return { ...j, ...match };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    return NextResponse.json({ query, location, source, totalFound: scored.length, jobs: scored });
  } catch (error) {
    console.error('POST /api/jobs/scan error:', error);
    return NextResponse.json({ error: 'Job scanning failed' }, { status: 500 });
  }
}
