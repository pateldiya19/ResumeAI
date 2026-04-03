import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseResume } from '@/lib/parsers/resume-parser';
import { rateLimit } from '@/lib/utils/rate-limiter';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed } = rateLimit(`upload:${session.user.id}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get('resume') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type (pdf or docx)
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
    return NextResponse.json(
      { error: 'Invalid file type. Please upload PDF or DOCX' },
      { status: 400 }
    );
  }

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseResume(buffer, file.name);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to parse resume' },
      { status: 500 }
    );
  }
}
