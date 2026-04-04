import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(59,130,246,0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(124,58,237,0.2),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm font-black text-white">R</div>
            <span className="text-lg font-bold text-white">ResumeAI</span>
          </Link>

          <div className="max-w-sm">
            <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1.5 mb-6">
              <span className="text-[10px] text-emerald-400 font-bold">FREE</span>
              <span className="text-[10px] text-white/50">3 analyses included</span>
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Start landing interviews
            </h1>
            <p className="text-base text-white/40 leading-relaxed mb-10">
              Join 10,000+ job seekers using AI to craft the perfect resume and outreach.
            </p>

            {/* Steps */}
            <div className="space-y-4">
              {[
                { n: '01', text: 'Upload resume — instant ATS score' },
                { n: '02', text: 'Paste a job — see your exact fit' },
                { n: '03', text: 'AI writes personalized cold emails' },
              ].map((f) => (
                <div key={f.n} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/40">{f.n}</div>
                  <span className="text-sm text-white/50">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {['No credit card', 'Cancel anytime', 'Free forever tier'].map((b) => (
              <div key={b} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-white/30">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — sign up form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="lg:hidden mb-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-sm font-black text-white">R</div>
          <span className="text-lg font-bold text-gray-900">ResumeAI</span>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
            <p className="text-sm text-gray-500 mt-1">Get started with your free account</p>
          </div>

          <SignUp
            forceRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: '#18181b',
                borderRadius: '12px',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none border-0 p-0 w-full gap-6',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                formButtonPrimary: 'bg-gray-900 hover:bg-gray-800 rounded-xl h-11 text-sm font-medium shadow-none',
                formFieldInput: 'rounded-xl border-gray-200 focus:border-gray-400 focus:ring-0 h-11 bg-gray-50/50 text-sm',
                formFieldLabel: 'text-gray-700 font-medium text-xs',
                footerActionLink: 'text-gray-900 hover:text-gray-700 font-medium text-sm',
                socialButtonsBlockButton: 'rounded-xl border-gray-200 h-11 hover:bg-gray-50 font-medium text-sm bg-white',
                socialButtonsBlockButtonText: 'text-gray-700',
                dividerLine: 'bg-gray-200',
                dividerText: 'text-gray-400 text-xs bg-white',
                footer: 'pt-4',
                identityPreviewEditButton: 'text-gray-500',
                formFieldInputShowPasswordButton: 'text-gray-400',
                otpCodeFieldInput: 'border-gray-200 rounded-xl',
              },
            }}
          />
        </div>

        <p className="mt-8 text-[11px] text-gray-400">
          By creating an account you agree to our Terms &amp; Privacy Policy
        </p>
      </div>
    </div>
  );
}
