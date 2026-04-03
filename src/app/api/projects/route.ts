import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import { ProjectSchema } from '@/lib/utils/validators';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const projects = await Project.find({ userId: session.user.id })
      .sort({ isHighlighted: -1, createdAt: -1 });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = ProjectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    // Max 20 projects per user
    const count = await Project.countDocuments({ userId: session.user.id });
    if (count >= 20) {
      return NextResponse.json(
        { error: 'Maximum 20 projects allowed' },
        { status: 400 }
      );
    }

    const project = await Project.create({
      ...validation.data,
      userId: session.user.id,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
