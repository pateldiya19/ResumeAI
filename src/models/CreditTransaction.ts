import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICreditTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  amount: number;
  balance: number;
  description: string;
  relatedResourceId?: mongoose.Types.ObjectId;
  relatedResourceType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['purchase', 'usage', 'bonus', 'refund'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    balance: {
      type: Number,
      required: [true, 'Balance is required'],
      min: [0, 'Balance cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    relatedResourceId: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
    relatedResourceType: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

CreditTransactionSchema.index({ userId: 1, createdAt: -1 });
CreditTransactionSchema.index({ type: 1 });
CreditTransactionSchema.index({ createdAt: -1 });

const CreditTransaction: Model<ICreditTransaction> =
  mongoose.models.CreditTransaction ||
  mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);

export default CreditTransaction;
