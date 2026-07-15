import Link from 'next/link';
import { verifyEmailAction } from '@/actions/auth.actions';
import { ROUTES } from '@/constants/routes';
import styles from '../auth.module.css';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // No token in URL — show guidance
  if (!token) {
    return (
      <div className={styles.formCard}>
        <div className={styles.successState}>
          <div className={styles.successIcon}>✉️</div>
          <h1 className={styles.successTitle}>Check your email</h1>
          <p className={styles.successText}>
            We sent a verification link to your email address.
            Click the link to activate your account.
          </p>
          <p className={styles.formFooter} style={{ marginTop: '1.5rem' }}>
            <Link href={ROUTES.LOGIN} className={styles.link}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // Token present — verify server-side (RSC)
  const result = await verifyEmailAction(token);

  if (result.success) {
    return (
      <div className={styles.formCard}>
        <div className={styles.successState}>
          <div className={styles.successIcon} style={{ background: '#f0fdf4', border: '2px solid #bbf7d0' }}>✅</div>
          <h1 className={styles.successTitle}>Email verified!</h1>
          <p className={styles.successText}>
            Your account is now active. You can sign in and start building.
          </p>
          <p className={styles.formFooter} style={{ marginTop: '1.5rem' }}>
            <Link href={ROUTES.LOGIN} className={styles.link}>Sign in to your account →</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.successState}>
        <div className={styles.successIcon} style={{ background: '#fef2f2', border: '2px solid #fecaca' }}>❌</div>
        <h1 className={styles.successTitle} style={{ color: '#dc2626' }}>Link expired</h1>
        <p className={styles.successText}>
          This verification link is invalid or has expired. Verification links are valid for 24 hours.
        </p>
        <p className={styles.formFooter} style={{ marginTop: '1.5rem' }}>
          <Link href={ROUTES.REGISTER} className={styles.link}>Create a new account</Link>
          {' · '}
          <Link href={ROUTES.LOGIN} className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
