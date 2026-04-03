import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

const DEFAULT_FROM_NAME = process.env.RESEND_FROM_NAME || 'ResumeAI';
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@resumeai.com';

function wrapInHtmlTemplate(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    p { margin: 0 0 16px 0; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
}): Promise<{ id: string; success: boolean }> {
  const fromAddress =
    params.from || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`;

  const htmlBody = params.body.startsWith('<')
    ? params.body
    : wrapInHtmlTemplate(
        params.body
          .split('\n')
          .map((line) => `<p>${line || '&nbsp;'}</p>`)
          .join('\n')
      );

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: htmlBody,
      replyTo: params.replyTo,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { id: '', success: false };
    }

    return { id: data?.id || '', success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { id: '', success: false };
  }
}
