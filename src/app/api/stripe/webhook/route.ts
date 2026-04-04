import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  await connectDB();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as 'pro' | 'enterprise';

    if (userId && plan) {
      await User.findByIdAndUpdate(userId, {
        plan,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      });
      console.log(`[Stripe] User ${userId} upgraded to ${plan}`);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const user = await User.findOne({
      stripeSubscriptionId: subscription.id,
    });
    if (user) {
      user.plan = 'free';
      user.stripeSubscriptionId = undefined;
      await user.save();
      console.log(`[Stripe] User ${user._id} downgraded to free`);
    }
  }

  return NextResponse.json({ received: true });
}
