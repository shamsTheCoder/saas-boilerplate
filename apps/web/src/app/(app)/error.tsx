'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error monitoring service (e.g., Sentry) in production
    console.error('[AppError Boundary]', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '3rem 2.5rem',
          textAlign: 'center',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '28px',
          }}
        >
          ⚠️
        </div>

        <h1
          style={{
            color: '#f1f5f9',
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 0.75rem',
            letterSpacing: '-0.025em',
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            color: '#94a3b8',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            margin: '0 0 2rem',
          }}
        >
          {error.message?.includes('fetch')
            ? 'We could not connect to our servers. Please check your connection and try again.'
            : 'An unexpected error occurred. Our team has been notified.'}
        </p>

        {/* Error digest for support */}
        {error.digest && (
          <p
            style={{
              color: '#475569',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              margin: '0 0 1.75rem',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Try again
          </button>

          <Link
            href="/"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'background 0.15s',
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
