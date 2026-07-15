'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/constants';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry or Datadog
    console.error('Unhandled Next.js Error:', error);
  }, [error]);

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <h1>Something went wrong!</h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: 'var(--space-4) auto' }}>
        We've caught an unexpected error. Our team has been notified, but you can try reloading the page or going back home.
      </p>
      
      <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-6)' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          Try again
        </button>
        <Link 
          href={ROUTES.HOME}
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
