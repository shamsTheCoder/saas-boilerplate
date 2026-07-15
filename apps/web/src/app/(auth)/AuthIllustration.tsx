"use client";

import React from "react";
import { SiNextdotjs, SiNestjs, SiStripe } from "react-icons/si";
import { LuLayers } from "react-icons/lu";
import styles from "./illustration.module.css";

export function AuthIllustration() {
  return (
    <div className={styles.illustrationContainer}>
      {/* Background Rings */}
      <div
        className={styles.ring}
        style={{ width: 340, height: 340, opacity: 0.08 }}
      />
      <div
        className={styles.ring}
        style={{ width: 240, height: 240, opacity: 0.12 }}
      />

      {/* SVG Connectors */}
      <svg
        className={styles.connectors}
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d="M 170 200 L 190 200 M 190 200 L 208 200 M 190 200 L 190 100 L 208 100 M 190 200 L 190 300 L 208 300"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M 272 200 L 340 200"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="3"
        />
      </svg>

      {/* Main Logo (Center Left) */}
      <div
        className={`${styles.node} ${styles.mainNode}`}
        style={{ top: "50%", left: "30%" }}
      >
        <div className={styles.iconCircle} style={{ background: "#2563eb" }}>
          <LuLayers size={48} color="white" />
        </div>
      </div>

      {/* Top Node: Next.js */}
      <div
        className={`${styles.node} ${styles.smallNode}`}
        style={{ top: "25%", left: "60%" }}
      >
        <div className={styles.iconCircle} style={{ background: "#000" }}>
          <SiNextdotjs size={20} color="white" />
        </div>
      </div>

      {/* Middle Node: NestJS */}
      <div
        className={`${styles.node} ${styles.smallNode}`}
        style={{ top: "50%", left: "60%" }}
      >
        <div className={styles.iconCircle} style={{ background: "#E0234E" }}>
          <SiNestjs size={22} color="white" />
        </div>
      </div>

      {/* Bottom Node: Stripe */}
      <div
        className={`${styles.node} ${styles.smallNode}`}
        style={{ top: "75%", left: "60%" }}
      >
        <div className={styles.iconCircle} style={{ background: "#635BFF" }}>
          <SiStripe size={20} color="white" />
        </div>
      </div>

      {/* Dashboard Card (Right) */}
      <div className={styles.dashboardCard} style={{ top: "50%", left: "85%" }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardLogo}>
            <div
              className={styles.iconCircle}
              style={{
                width: 24,
                height: 24,
                background: "#2563eb",
                boxShadow: "none",
              }}
            >
              <LuLayers size={12} color="white" />
            </div>
          </div>
          <div className={styles.cardTitle}>Dashboard</div>
        </div>

        <div className={styles.cardRow}>
          <div className={styles.avatar} style={{ background: "#fbcfe8" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#be185d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className={styles.lines}>
            <div className={styles.line1} />
            <div className={styles.line2} style={{ width: "80%" }} />
          </div>
        </div>
        <div className={styles.cardRow}>
          <div className={styles.avatar} style={{ background: "#bbf7d0" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#15803d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className={styles.lines}>
            <div className={styles.line1} />
            <div className={styles.line2} style={{ width: "60%" }} />
          </div>
        </div>
        <div className={styles.cardRow}>
          <div className={styles.avatar} style={{ background: "#fed7aa" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c2410c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className={styles.lines}>
            <div className={styles.line1} />
            <div className={styles.line2} style={{ width: "40%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
