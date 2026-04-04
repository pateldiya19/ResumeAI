import { auth, currentUser } from '@clerk/nextjs/server';
import { connectDB } from './db';
import User from '@/models/User';

export { auth };

/**
 * Get the current authenticated user's session data with DB-resolved role and plan.
 * Used by API routes that need user id, role, or plan.
 */
export async function getAuthSession() {
  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();
  let dbUser = await User.findOne({ clerkId: userId });

  // Auto-create user on first API call (syncs from Clerk)
  if (!dbUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(email.toLowerCase());

    dbUser = await User.create({
      clerkId: userId,
      email,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      avatar: clerkUser.imageUrl,
      role: isAdmin ? 'admin' : 'user',
      plan: 'free',
      credits: 0,
    });
  }

  // Re-check admin status on every call (in case ADMIN_EMAILS changed)
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const shouldBeAdmin = adminEmails.includes(dbUser.email.toLowerCase());
  if (shouldBeAdmin && dbUser.role !== 'admin') {
    dbUser.role = 'admin';
    await dbUser.save();
  }

  return {
    user: {
      id: dbUser._id.toString(),
      clerkId: userId,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as 'user' | 'admin',
      plan: dbUser.plan as 'free' | 'pro' | 'enterprise',
    },
  };
}
