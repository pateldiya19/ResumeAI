import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body as { sessionId: string };

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = checkoutSession.metadata?.userId;
    const plan = checkoutSession.metadata?.plan as 'pro' | 'enterprise';

    if (!userId || !plan) {
      return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
    }

    // Verify the user making the request matches the checkout session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Session mismatch' }, { status: 403 });
    }

    await connectDB();

    // Update user plan
    const user = await User.findByIdAndUpdate(
      userId,
      {
        plan,
        stripeCustomerId: checkoutSession.customer as string,
        stripeSubscriptionId: checkoutSession.subscription as string,
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan: user.plan,
      message: `Successfully upgraded to ${plan}!`,
    });
  } catch (error: unknown) {
    console.error('POST /api/stripe/verify error:', error);
    const message = error instanceof Error ? error.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
