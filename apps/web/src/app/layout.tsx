import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    // Each page sets its own title — this is the fallback if they don't
    default: 'SaaS Boilerplate',
    template: '%s | SaaS Boilerplate',
  },
  description: 'A production-ready SaaS starter with auth, multi-tenancy, and billing built in.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/*
        data-theme="light" by default — switching to "dark" flips all the CSS token values.
        We'll add proper theme persistence (localStorage + system preference) in a later day.
      */}
      <body data-theme="light">{children}</body>
    </html>
  );
}
