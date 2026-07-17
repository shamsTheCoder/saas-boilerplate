'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { loginAction } from '@/actions/auth.actions';
import { ROUTES } from '@/constants/routes';
import styles from '../auth.module.css';

const initialState = { success: false as boolean, error: '' };

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const shakeVariants = {
  shake: {
    x: [-8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.45 },
  },
};

// useFormStatus must be a child of the <form>
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
      {pending ? (
        <>
          <span className={styles.spinner} />
          Logging in…
        </>
      ) : (
        'Log in'
      )}
    </motion.button>
  );
}

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <div className={styles.formCard}>
      <motion.div
        className={styles.formHeader}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className={styles.formTitle}>Log in to your Account</h1>
        <p className={styles.formSubtitle}>Welcome back! Select method to log in:</p>
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
            transition={{ duration: 0.2 }}
          >
            {state.error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        action={action}
        variants={shakeVariants}
        animate={state.error ? 'shake' : ''}
      >
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
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
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${styles.formInput} ${styles.inputWithIcon}`}
                required
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={styles.formOptionsRow}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} />
              Remember me
            </label>
            <Link href={ROUTES.FORGOT_PASSWORD} className={styles.forgotLink}>Forgot password?</Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <SubmitButton />
          </motion.div>
        </motion.div>
      </motion.form>

      <p className={styles.formFooter}>
        Don&apos;t have an account?{' '}
        <Link href={ROUTES.REGISTER} className={styles.link}>Create account</Link>
      </p>
    </div>
  );
}
