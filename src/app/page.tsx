'use client';

import Link from 'next/link';

const features = [
  {
    title: 'ATS Score Analysis',
    desc: 'Get instant feedback on how well your resume passes Applicant Tracking Systems with detailed breakdowns.',
    icon: '📊',
  },
  {
    title: 'AI Resume Optimization',
    desc: 'Receive optimized bullet points and keyword suggestions tailored to your target role.',
    icon: '✨',
  },
  {
    title: 'Recruiter Persona Intel',
    desc: 'Understand the recruiter behind the listing and craft outreach that resonates with them.',
    icon: '🎯',
  },
  {
    title: 'Personalized Cold Emails',
    desc: 'Generate and send three email variants tuned to the recruiter\'s communication style.',
    icon: '📧',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold" style={{ color: 'hsl(160, 84%, 39%)' }}>
          ResumeAI
        </span>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition"
            style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
          One platform. Five tools.
          <br />
          <span style={{ color: 'hsl(160, 84%, 39%)' }}>Zero friction.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Upload your resume, paste a recruiter&apos;s LinkedIn URL, and get AI-powered resume
          optimization, ATS scoring, and personalized cold emails — all in one click.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 text-lg font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transition"
            style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 text-lg font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything you need to land interviews
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 text-sm text-gray-500">
        &copy; 2026 ResumeAI. Built for the hackathon.
      </footer>
    </div>
  );
}
