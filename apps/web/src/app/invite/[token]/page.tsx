import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Accept Invitation' };

// This page is public — someone clicked an invite link in their email
// We'll validate the token and show a signup/accept form on Day 5
export default function InvitePage({ params }: { params: { token: string } }) {
  return (
    <main>
      <h1>You've been invited!</h1>
      <p>Invitation token: {params.token}</p>
      <p>Accept form goes here — Day 5.</p>
    </main>
  );
}
