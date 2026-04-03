import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  techStack: string[];
  liveUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  startDate?: Date;
  endDate?: Date;
  isHighlighted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    techStack: {
      type: [String],
      validate: {
        validator: (v: string[]) => v.length <= 15,
        message: 'Tech stack must have at most 15 items',
      },
      default: [],
    },
    liveUrl: {
      type: String,
      trim: true,
      default: undefined,
    },
    githubUrl: {
      type: String,
      trim: true,
      default: undefined,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: undefined,
    },
    startDate: {
      type: Date,
      default: undefined,
    },
    endDate: {
      type: Date,
      default: undefined,
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ userId: 1, isHighlighted: -1, createdAt: -1 });

const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
