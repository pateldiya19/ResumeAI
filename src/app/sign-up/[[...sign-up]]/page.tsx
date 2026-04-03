import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative flex flex-col justify-center px-16 text-white">
          <Link href="/" className="text-2xl font-bold mb-12">ResumeAI</Link>
          <h1 className="text-4xl font-bold font-display leading-tight mb-4">
            Start landing more<br />interviews today
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Join thousands of job seekers using AI to craft perfect resumes and personalized outreach.
          </p>
          <div className="mt-8 flex items-center gap-6 text-sm text-white/60">
            <span>✓ Free to start</span>
            <span>✓ No credit card</span>
            <span>✓ 3 free analyses</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 bg-[#FAFAF8]">
        <div className="lg:hidden mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-600">ResumeAI</Link>
        </div>
        <SignUp
          forceRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#6C3AED',
              borderRadius: '12px',
              fontFamily: 'Inter, system-ui, sans-serif',
            },
            elements: {
              card: 'shadow-xl ring-1 ring-black/5 rounded-2xl',
              formButtonPrimary: 'bg-[#6C3AED] hover:bg-[#5B21B6] rounded-xl shadow-sm',
              formFieldInput: 'rounded-xl border-gray-200 focus:border-[#6C3AED] focus:ring-[#6C3AED]/20',
              footerActionLink: 'text-[#6C3AED] hover:text-[#5B21B6]',
            },
          }}
        />
      </div>
    </div>
  );
}
