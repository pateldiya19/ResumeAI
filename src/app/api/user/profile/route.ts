import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { UpdateProfileSchema } from '@/lib/utils/validators';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select(
      'name email avatar plan role authProvider createdAt lastActiveAt'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      role: user.role,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    });
  } catch (error) {
    console.error('GET /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = UpdateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, currentPassword, newPassword } = validation.data;

    await connectDB();

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (name) {
      updateData.name = name;
    }

    // Handle password change
    if (newPassword && currentPassword) {
      const user = await User.findById(session.user.id).select('+password authProvider');
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (user.authProvider !== 'credentials') {
        return NextResponse.json(
          { error: 'Password change is only available for email/password accounts' },
          { status: 400 }
        );
      }

      if (!user.password) {
        return NextResponse.json(
          { error: 'No password set for this account' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    ).select('name email avatar plan role authProvider createdAt');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      plan: updatedUser.plan,
      role: updatedUser.role,
      authProvider: updatedUser.authProvider,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    console.error('PUT /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
