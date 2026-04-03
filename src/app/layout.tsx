import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, DM_Serif_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ResumeAI - AI-Powered Job Application Platform',
  description:
    'Upload your resume, paste a recruiter LinkedIn URL, and get AI-powered resume optimization, ATS scoring, and personalized cold emails.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="font-sans antialiased">
        <ClerkProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                border: '1px solid hsl(40, 10%, 90%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              },
            }}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}
