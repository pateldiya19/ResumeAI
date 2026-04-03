import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Analysis from '@/models/Analysis';
import { SendEmailSchema } from '@/lib/utils/validators';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { checkSendLimit, incrementSendCount } from '@/lib/services/usage-tracker';
import { sendApplicationEmail } from '@/lib/services/email-sender';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Must be pro or enterprise
  if (!['pro', 'enterprise'].includes(session.user.plan)) {
    return NextResponse.json(
      { error: 'Premium feature. Upgrade to Pro or Enterprise.' },
      { status: 403 }
    );
  }

  // Rate limit: 3 sends per minute
  const { allowed } = rateLimit(`send:${session.user.id}`, 3, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json();
  const validation = SendEmailSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await connectDB();

  // Check send limits
  const limitCheck = await checkSendLimit(session.user.id);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: 'Monthly send limit reached.', usage: limitCheck },
      { status: 403 }
    );
  }

  // Fetch analysis with email (server-side only)
  const analysis = await Analysis.findById(validation.data.analysisId);
  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }
  if (analysis.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!analysis.target?.scrapedEmail) {
    return NextResponse.json(
      { error: 'Recruiter email not available for this analysis' },
      { status: 400 }
    );
  }
  if (!analysis.generatedEmails || analysis.generatedEmails.length === 0) {
    return NextResponse.json(
      { error: 'No emails generated yet. Wait for analysis to complete.' },
      { status: 400 }
    );
  }

  const emailVariant = analysis.generatedEmails[validation.data.emailIndex];
  if (!emailVariant) {
    return NextResponse.json({ error: 'Invalid email index' }, { status: 400 });
  }

  // Send the email via Resend
  const result = await sendApplicationEmail({
    userId: session.user.id,
    analysisId: analysis._id.toString(),
    recipientEmail: analysis.target.scrapedEmail,
    recipientName: analysis.target.name || 'Hiring Manager',
    recipientCompany: analysis.target.company || '',
    emailTone: emailVariant.tone,
    subject: emailVariant.subject,
    body: emailVariant.body,
  });

  if (result.success) {
    await incrementSendCount(session.user.id);
  }

  return NextResponse.json(result);
}
