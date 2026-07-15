import React from 'react';
import Link from 'next/link';
import { LuLayers } from 'react-icons/lu';
import { AuthIllustration } from './AuthIllustration';
import styles from './auth.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.authLayout}>
      {/* ── Left: Form ── */}
      <main className={styles.formPanel}>
        <div className={styles.formContainer}>
          {/* Logo above form */}
          <div className={styles.formLogo}>
            <div className={styles.logoMark}>
              <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuLayers size={16} color="white" />
              </div>
            </div>
            <span className={styles.brandName}>SaaS Boilerplate</span>
          </div>

          {children}
        </div>
      </main>

      {/* ── Right: Vivid Blue Brand Panel ── */}
      <aside className={styles.brandPanel} aria-hidden="true">
        {/* Custom HTML/CSS Illustration */}
        <AuthIllustration />

        {/* Caption */}
        <div className={styles.panelCaption}>
          <p className={styles.panelHeadline}>Everything you need to ship faster.</p>
          <p className={styles.panelSubline}>
            Auth, billing, multi-tenancy, and security<br />
            included out of the box.
          </p>
        </div>

        {/* Carousel dots */}
        <div className={styles.panelDots}>
          <span className={`${styles.dot} ${styles.dotActive}`} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </aside>
    </div>
  );
}
