import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { RegisterSchema } from '@/lib/utils/validators';
import { rateLimit } from '@/lib/utils/rate-limiter';

export async function POST(req: NextRequest) {
  // Rate limit: 3 per minute per IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { allowed } = rateLimit(`register:${ip}`, 3, 60000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  // Parse and validate body
  const body = await req.json();
  const result = RegisterSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });

  const { name, email, password } = result.data;

  await connectDB();

  // Check existing
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Check admin
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes(email.toLowerCase());

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    name,
    password: hashedPassword,
    authProvider: 'credentials',
    role: isAdmin ? 'admin' : 'user',
    plan: 'free',
    credits: 0,
  });

  return NextResponse.json({ userId: user._id.toString() }, { status: 201 });
}
