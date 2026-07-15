'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { resetPasswordAction, FormState } from '@/actions/auth.actions';
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

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      className={styles.submitBtn}
      disabled={pending || disabled}
      whileTap={{ scale: 0.98 }}
    >
      {pending ? <><span className={styles.spinner} />Resetting…</> : 'Reset password'}
    </motion.button>
  );
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [confirmPw, setConfirmPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const passwordsMatch = newPw.length > 0 && confirmPw.length > 0 && newPw === confirmPw;

  // Bind token from search params into the action signature
  const boundAction = async (
    prevState: FormState,
    formData: FormData,
  ): Promise<FormState> => {
    const { token } = await searchParams;
    if (!token) {
      return { success: false, error: 'Missing reset token. Please use the link from your email.' };
    }
    return resetPasswordAction(token, formData);
  };

  const [state, action] = useFormState(boundAction, initialState);

  if (state.success) {
    return (
      <div className={styles.formCard}>
        <motion.div
          className={styles.successState}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.successIcon}>🔐</div>
          <h2 className={styles.successTitle}>Password reset!</h2>
          <p className={styles.successText}>
            Your password has been updated. All other sessions have been signed out for security.
          </p>
          <p className={styles.formFooter} style={{ marginTop: '1.5rem' }}>
            <Link href={ROUTES.LOGIN} className={styles.link}>Sign in with new password →</Link>
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
        <h1 className={styles.formTitle}>Set new password</h1>
        <p className={styles.formSubtitle}>At least 8 chars, 1 uppercase, 1 number</p>
      </motion.div>

      <AnimatePresence>
        {state.error && (
          <motion.div
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
            <label htmlFor="password" className={styles.formLabel}>New password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={styles.formInput}
              required
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </motion.div>

          <motion.div variants={itemVariants} className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="confirmPassword" className={styles.formLabel}>Confirm password</label>
              <AnimatePresence>
                {passwordsMatch && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: '0.8125rem', color: '#22c55e', fontFamily: 'Inter, sans-serif' }}
                  >
                    ✓ Match
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`${styles.formInput}${confirmPw.length > 0 && !passwordsMatch ? ` ${styles.error}` : ''}`}
              required
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
            {confirmPw.length > 0 && !passwordsMatch && (
              <span className={styles.fieldError}>Passwords do not match</span>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <SubmitButton disabled={!passwordsMatch} />
          </motion.div>
        </motion.div>
      </form>
    </div>
  );
}
