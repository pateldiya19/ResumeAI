import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getStripe, PLANS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { plan } = body as { plan: 'pro' | 'enterprise' };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!PLANS[plan].priceId) {
      return NextResponse.json(
        { error: `Stripe price ID not configured for ${plan} plan. Set STRIPE_${plan.toUpperCase()}_PRICE_ID in .env.local` },
        { status: 500 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local' },
        { status: 500 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLANS[plan].priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        userId: session.user.id,
        plan,
      },
      success_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?cancelled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('POST /api/stripe/checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
