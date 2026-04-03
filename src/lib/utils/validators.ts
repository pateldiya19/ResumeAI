import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const AnalyzeSchema = z.object({
  resumeText: z.string().min(50),
  resumeFileName: z.string(),
  candidateLinkedInUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  targetLinkedInUrl: z
    .string()
    .url()
    .refine((url) => url.includes('linkedin.com'), {
      message: 'Must be a LinkedIn URL',
    }),
  jobDescriptionText: z
    .string()
    .optional()
    .or(z.literal('')),
});

export const SendEmailSchema = z.object({
  analysisId: z.string(),
  emailIndex: z.number().min(0).max(2),
});

export const ProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  techStack: z.array(z.string()).max(15).default([]),
  liveUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  githubUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  startDate: z
    .string()
    .optional()
    .or(z.literal('')),
  endDate: z
    .string()
    .optional()
    .or(z.literal('')),
  isHighlighted: z.boolean().optional().default(false),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, { message: 'Current password is required to set a new password', path: ['currentPassword'] });

export const AdminUserActionSchema = z.object({
  action: z.enum(['ban', 'unban', 'change_plan', 'add_credits']),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  credits: z.number().optional(),
  reason: z.string().optional(),
});

export const ModerationActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'ban']),
  note: z.string().optional(),
});

// Inferred types for convenience
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type AnalyzeInput = z.infer<typeof AnalyzeSchema>;
export type SendEmailInput = z.infer<typeof SendEmailSchema>;
export type ProjectInput = z.infer<typeof ProjectSchema>;
export type AdminUserActionInput = z.infer<typeof AdminUserActionSchema>;
export type ModerationActionInput = z.infer<typeof ModerationActionSchema>;
