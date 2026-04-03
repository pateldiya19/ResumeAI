'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification link has expired or has already been used.',
    OAuthSignin: 'Error connecting to the OAuth provider.',
    OAuthCallback: 'Error processing the OAuth callback.',
    OAuthCreateAccount: 'Could not create an account using OAuth.',
    EmailCreateAccount: 'Could not create an account with that email.',
    Callback: 'An error occurred during the callback.',
    OAuthAccountNotLinked: 'This email is already associated with another account.',
    CredentialsSignin: 'Invalid email or password.',
    Default: 'An unexpected error occurred.',
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition"
          style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
