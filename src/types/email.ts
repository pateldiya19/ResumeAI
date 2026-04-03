export type EmailTone = 'professional' | 'conversational' | 'mutual_connection';

export interface EmailVariant {
  tone: EmailTone;
  subject: string;
  body: string;
  openingHook: string;
  matchPoints: string[];
  cta: string;
}

export interface SendResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface TrackingData {
  messageId: string;
  status: string;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
}
