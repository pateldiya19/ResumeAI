import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResumeAI - AI-Powered Job Application Platform',
  description:
    'Upload your resume, paste a recruiter LinkedIn URL, and get AI-powered resume optimization, ATS scoring, and personalized cold emails.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
