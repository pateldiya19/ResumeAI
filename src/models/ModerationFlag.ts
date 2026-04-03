import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IModerationFlag extends Document {
  _id: mongoose.Types.ObjectId;
  type:
    | 'spam'
    | 'abuse'
    | 'inappropriate_content'
    | 'fake_profile'
    | 'rate_limit_exceeded'
    | 'suspicious_activity'
    | 'other';
  reason:
    | 'automated_detection'
    | 'user_report'
    | 'admin_review'
    | 'system_alert';
  description: string;
  targetUserId: mongoose.Types.ObjectId;
  targetResourceId?: mongoose.Types.ObjectId;
  targetResourceType?: string;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  autoFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModerationFlagSchema = new Schema<IModerationFlag>(
  {
    type: {
      type: String,
      enum: [
        'spam',
        'abuse',
        'inappropriate_content',
        'fake_profile',
        'rate_limit_exceeded',
        'suspicious_activity',
        'other',
      ],
      required: [true, 'Flag type is required'],
    },
    reason: {
      type: String,
      enum: ['automated_detection', 'user_report', 'admin_review', 'system_alert'],
      required: [true, 'Reason is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target user ID is required'],
      index: true,
    },
    targetResourceId: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
    targetResourceType: {
      type: String,
      default: undefined,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'banned'],
      default: 'pending',
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
    reviewedAt: {
      type: Date,
      default: undefined,
    },
    reviewNote: {
      type: String,
      trim: true,
      default: undefined,
    },
    autoFlagged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ModerationFlagSchema.index({ status: 1, createdAt: -1 });
// targetUserId already indexed via `index: true` on the schema field
ModerationFlagSchema.index({ type: 1 });
ModerationFlagSchema.index({ autoFlagged: 1 });

const ModerationFlag: Model<IModerationFlag> =
  mongoose.models.ModerationFlag ||
  mongoose.model<IModerationFlag>('ModerationFlag', ModerationFlagSchema);

export default ModerationFlag;
