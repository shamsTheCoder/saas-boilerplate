'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { forgotPasswordAction, FormState } from '@/actions/auth.actions';
import { ROUTES } from '@/constants/routes';
import styles from '../auth.module.css';

const initialState: FormState = { success: false, error: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      className={styles.submitBtn}
      disabled={pending}
      whileTap={{ scale: 0.98 }}
    >
      {pending ? <><span className={styles.spinner} />Sending…</> : 'Send reset link'}
    </motion.button>
  );
}

export default function ForgotPasswordPage() {
  const [state, action] = useFormState(forgotPasswordAction, initialState);

  return (
    <div className={styles.formCard}>
      <AnimatePresence mode="wait">
        {state.success ? (
          <motion.div
            key="success"
            className={styles.successState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.successIcon}>📬</div>
            <h2 className={styles.successTitle}>Check your inbox</h2>
            <p className={styles.successText}>
              If that email is registered, we&apos;ve sent a password
              reset link. It expires in 1 hour.
            </p>
            <p className={styles.formFooter} style={{ marginTop: '1.5rem' }}>
              <Link href={ROUTES.LOGIN} className={styles.link}>← Back to sign in</Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <motion.div
              className={styles.formHeader}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className={styles.formTitle}>Forgot your password?</h1>
              <p className={styles.formSubtitle}>No worries — we&apos;ll send you a reset link</p>
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
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={styles.formInput}
                  required
                />
              </div>
              <SubmitButton />
            </form>

            <p className={styles.formFooter}>
              <Link href={ROUTES.LOGIN} className={styles.link}>← Back to sign in</Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
