import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  clerkId: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
  credits: number;
  monthlyAnalysesUsed: number;
  monthlyAnalysesReset: Date;
  monthlySendsUsed: number;
  monthlySendsReset: Date;
  isBanned: boolean;
  banReason?: string;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: [true, 'Clerk ID is required'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    avatar: {
      type: String,
      default: undefined,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    credits: {
      type: Number,
      default: 0,
      min: [0, 'Credits cannot be negative'],
    },
    monthlyAnalysesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyAnalysesReset: {
      type: Date,
      default: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      },
    },
    monthlySendsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlySendsReset: {
      type: Date,
      default: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      },
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: undefined,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ plan: 1 });
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
