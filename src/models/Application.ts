import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  analysisId: mongoose.Types.ObjectId;
  recipientName: string;
  recipientCompany: string;
  emailTone: 'professional' | 'conversational' | 'mutual_connection';
  subject: string;
  body: string;
  status:
    | 'queued'
    | 'sent'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'bounced'
    | 'failed';
  resendMessageId?: string;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: 'Analysis',
      required: [true, 'Analysis ID is required'],
      index: true,
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    recipientCompany: {
      type: String,
      required: [true, 'Recipient company is required'],
      trim: true,
    },
    emailTone: {
      type: String,
      enum: ['professional', 'conversational', 'mutual_connection'],
      required: [true, 'Email tone is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'],
      default: 'queued',
      required: true,
    },
    resendMessageId: {
      type: String,
      default: undefined,
    },
    sentAt: {
      type: Date,
      default: undefined,
    },
    openedAt: {
      type: Date,
      default: undefined,
    },
    clickedAt: {
      type: Date,
      default: undefined,
    },
    errorMessage: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

ApplicationSchema.index({ userId: 1, createdAt: -1 });
ApplicationSchema.index({ status: 1 });

const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application;
