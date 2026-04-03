import { getAuthSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

interface AuthSession {
  user: {
    id: string;
    clerkId: string;
    email: string;
    name: string;
    role: string;
    plan: string;
  };
}

interface AuthResult {
  session: AuthSession;
}

export async function requireAdmin(): Promise<AuthResult | NextResponse> {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  return { session };
}

export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return { session };
}

export function isAuthResult(
  result: AuthResult | NextResponse
): result is AuthResult {
  return 'session' in result;
}
