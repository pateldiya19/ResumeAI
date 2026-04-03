import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import User from '@/models/User';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select('+password');
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return { id: user._id.toString(), email: user.email, name: user.name, image: user.avatar, role: user.role, plan: user.plan };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
          const isAdmin = adminEmails.includes(user.email!.toLowerCase());
          await User.create({
            email: user.email,
            name: user.name,
            avatar: user.image,
            authProvider: 'google',
            role: isAdmin ? 'admin' : 'user',
            plan: 'free',
            credits: 0,
          });
        } else if (existingUser.isBanned) {
          return false; // Block banned users
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.plan = dbUser.plan;
        }
      }
      if (trigger === 'update' && session) {
        // Allow session updates
        token.role = session.role || token.role;
        token.plan = session.plan || token.plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'admin';
        session.user.plan = token.plan as 'free' | 'pro' | 'enterprise';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
  session: { strategy: 'jwt' },
});
