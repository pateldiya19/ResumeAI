import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    plan: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface AuthResult {
  session: AuthSession;
}

export async function requireAdmin(): Promise<AuthResult | NextResponse> {
  const session = (await auth()) as AuthSession | null;

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
  const session = (await auth()) as AuthSession | null;

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
