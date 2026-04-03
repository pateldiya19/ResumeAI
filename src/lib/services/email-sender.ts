import { connectDB } from '@/lib/db';
import { sendEmail } from '@/lib/resend';
import Application from '@/models/Application';
import mongoose from 'mongoose';

interface SendApplicationEmailParams {
  userId: string;
  analysisId: string;
  recipientEmail: string;
  recipientName: string;
  recipientCompany: string;
  emailTone: 'professional' | 'conversational' | 'mutual_connection';
  subject: string;
  body: string;
  replyTo?: string;
}

export async function sendApplicationEmail(
  params: SendApplicationEmailParams
): Promise<{ applicationId: string; success: boolean }> {
  await connectDB();

  const {
    userId,
    analysisId,
    recipientEmail,
    recipientName,
    recipientCompany,
    emailTone,
    subject,
    body,
    replyTo,
  } = params;

  // Create the Application record first in "queued" status
  const application = await Application.create({
    userId: new mongoose.Types.ObjectId(userId),
    analysisId: new mongoose.Types.ObjectId(analysisId),
    recipientName,
    recipientCompany,
    emailTone,
    subject,
    body,
    status: 'queued',
  });

  const applicationId = application._id.toString();

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      body,
      replyTo,
    });

    if (result.success) {
      application.status = 'sent';
      application.resendMessageId = result.id;
      application.sentAt = new Date();
      await application.save();
      return { applicationId, success: true };
    } else {
      application.status = 'failed';
      application.errorMessage = 'Email delivery failed via Resend API';
      await application.save();
      return { applicationId, success: false };
    }
  } catch (err: any) {
    application.status = 'failed';
    application.errorMessage = err.message || 'Unexpected error sending email';
    await application.save();
    console.error('[EmailSender] Failed to send email:', err);
    return { applicationId, success: false };
  }
}
