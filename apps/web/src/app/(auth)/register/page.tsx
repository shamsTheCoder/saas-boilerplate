'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { registerAction, FormState } from '@/actions/auth.actions';
import { ROUTES } from '@/constants/routes';
import styles from '../auth.module.css';

const initialState: FormState = { success: false, error: '' };

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

function getPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      className={styles.submitBtn}
      disabled={pending}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
    >
      {pending ? <><span className={styles.spinner} />Creating account…</> : 'Create account'}
    </motion.button>
  );
}

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, initialState);
  const [password, setPassword] = useState('');
  const strength = getPasswordStrength(password);

  if (state.success && state.message) {
    return (
      <div className={styles.formCard}>
        <motion.div
          className={styles.successState}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.successIcon}>✉️</div>
          <h2 className={styles.successTitle}>Check your email</h2>
          <p className={styles.successText}>
            We sent a verification link to your inbox.<br />
            Click it to activate your account.
          </p>
          <p className={styles.formFooter} style={{ marginTop: '1.5rem' }}>
            Already verified?{' '}
            <Link href={ROUTES.LOGIN} className={styles.link}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      <motion.div
        className={styles.formHeader}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className={styles.formTitle}>Create an Account</h1>
        <p className={styles.formSubtitle}>Sign up with your email or social accounts:</p>
      </motion.div>

      <div className={styles.socialGrid}>
        <button type="button" className={styles.socialBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
        <button type="button" className={styles.socialBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" fill="#1877F2" />
          </svg>
          Facebook
        </button>
      </div>

      <div className={styles.divider}>
        or continue with email
      </div>

      <AnimatePresence mode="wait">
        {state.error && (
          <motion.div
            key="error"
            className={styles.alertError}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {state.error}
          </motion.div>
        )}
      </AnimatePresence>

      <form action={action}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className={styles.formGroup}>
            <label htmlFor="name" className={styles.formLabel}>
              Full Name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            </label>
            <div className={styles.inputIconWrapper}>
              <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Alice Smith"
                className={`${styles.formInput} ${styles.inputWithIcon}`}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Email Address</label>
            <div className={styles.inputIconWrapper}>
              <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={`${styles.formInput} ${styles.inputWithIcon}`}
                required
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>Password</label>
            <div className={styles.inputIconWrapper}>
              <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className={`${styles.formInput} ${styles.inputWithIcon}`}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {password.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={styles.strengthBar}>
                  <motion.div
                    className={styles.strengthFill}
                    style={{ background: strengthColors[strength] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${strength * 25}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className={styles.strengthLabel} style={{ color: strengthColors[strength] || '#9ca3af' }}>
                  {strengthLabels[strength] || 'Enter password'}
                </p>
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <SubmitButton />
          </motion.div>
        </motion.div>
      </form>

      <p className={styles.formFooter}>
        Already have an account?{' '}
        <Link href={ROUTES.LOGIN} className={styles.link}>Sign in</Link>
      </p>
    </div>
  );
}
