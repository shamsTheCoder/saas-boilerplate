import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LuShieldCheck,
  LuBuilding2,
  LuCreditCard,
  LuZap,
  LuClipboardList,
  LuRocket,
  LuLayoutDashboard,
  LuUsers,
  LuSettings,
  LuScroll,
  LuArrowRight,
  LuChevronLeft,
  LuChevronRight,
  LuRotateCw,
  LuLock,
  LuLayers,
  LuDatabase,
  LuShield,
  LuMail,
  LuFileJson,
  LuServer,
} from 'react-icons/lu';
import {
  SiNestjs,
  SiNextdotjs,
  SiTypescript,
  SiPostgresql,
  SiPrisma,
  SiRedis,
  SiDocker,
  SiStripe,
} from 'react-icons/si';
import s from './page.module.css';
import { ROUTES } from '@/constants';
import { DemoCard } from './DemoCard';

export const metadata: Metadata = {
  title: 'SaaS Boilerplate — Ship faster, scale smarter',
  description: 'A production-ready SaaS starter with auth, multi-tenancy, and Stripe billing. Built on NestJS, Next.js 14, PostgreSQL, and Redis.',
};

// The bar heights for the fake chart in the demo card
const BAR_HEIGHTS = [30, 55, 40, 70, 50, 90, 65, 80, 45, 100, 75, 60];
const ACTIVE_BAR = 9;

const FEATURES = [
  {
    Icon: LuShieldCheck,
    iconColor: 'hsl(245 80% 50%)',
    bg: 'hsl(245 80% 97%)',
    title: 'Full Auth System',
    desc: 'Secure login, signup, and password reset with argon2 hashing, httpOnly JWT cookies, and automatic refresh token rotation.',
  },
  {
    Icon: LuBuilding2,
    iconColor: 'hsl(200 80% 45%)',
    bg: 'hsl(200 80% 97%)',
    title: 'Multi-Tenant by Default',
    desc: 'Every user belongs to an Organization. Invite members, assign roles (OWNER, ADMIN, MEMBER), and manage permissions out of the box.',
  },
  {
    Icon: LuCreditCard,
    iconColor: 'hsl(145 60% 38%)',
    bg: 'hsl(145 70% 97%)',
    title: 'Stripe Billing Ready',
    desc: 'Subscription model wired into the database from day one. Webhooks, plan upgrades, and Stripe Customer Portal are all accounted for.',
  },
  {
    Icon: LuZap,
    iconColor: 'hsl(35 95% 45%)',
    bg: 'hsl(45 100% 97%)',
    title: 'Hybrid BFF Architecture',
    desc: 'Next.js Server Actions call NestJS directly over the private network — no round trips through the browser, no API key exposure.',
  },
  {
    Icon: LuClipboardList,
    iconColor: 'hsl(280 60% 50%)',
    bg: 'hsl(280 70% 97%)',
    title: 'Audit Logging',
    desc: 'Every sensitive action (user created, plan changed, member removed) is automatically written to an immutable AuditLog table.',
  },
  {
    Icon: LuRocket,
    iconColor: 'hsl(10 80% 50%)',
    bg: 'hsl(10 80% 97%)',
    title: 'Job Queue (BullMQ)',
    desc: 'Background email and webhook jobs backed by Redis and BullMQ. Retries, dead-letter queues, and a dashboard UI included.',
  },
];

const STACK = [
  { name: 'NestJS', Icon: SiNestjs, color: '#E0234E' },
  { name: 'Next.js 14', Icon: SiNextdotjs, color: 'currentColor' },
  { name: 'TypeScript', Icon: SiTypescript, color: '#3178C6' },
  { name: 'PostgreSQL', Icon: SiPostgresql, color: '#4169E1' },
  { name: 'Prisma', Icon: SiPrisma, color: 'currentColor' },
  { name: 'Redis', Icon: SiRedis, color: '#DC382D' },
  { name: 'Docker', Icon: SiDocker, color: '#2496ED' },
  { name: 'Stripe', Icon: SiStripe, color: '#008CDD' },
  { name: 'NX Monorepo', Icon: LuLayers, color: 'currentColor' },
  { name: 'BullMQ', Icon: LuDatabase, color: 'currentColor' },
  { name: 'Argon2', Icon: LuShield, color: 'currentColor' },
  { name: 'Nodemailer', Icon: LuMail, color: 'currentColor' },
  { name: 'Pino', Icon: LuFileJson, color: 'currentColor' },
  { name: 'Swagger', Icon: LuServer, color: '#85EA2D' },
];

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', active: true, Icon: LuLayoutDashboard },
  { label: 'Members', Icon: LuUsers },
  { label: 'Billing', Icon: LuCreditCard },
  { label: 'Settings', Icon: LuSettings },
  { label: 'Audit Log', Icon: LuScroll },
];

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className={s.hero}>
        <div className={s.heroContent}>
          <div className={s.badge}>
            <span /> Ready to ship
          </div>

          <h1 className={s.headline}>
            Launch your SaaS{' '}
            <span className={s.gradient}>in days, not months</span>
          </h1>

          <p className={s.subtitle}>
            A production-grade monorepo with auth, multi-tenancy, billing, audit logs, and a full job queue — wired together so you can focus on your actual product.
          </p>

          <div className={s.ctas}>
            <Link href={ROUTES.login} className={s.ctaPrimary}>
              Start building <LuArrowRight size={16} />
            </Link>
            <a
              href="http://localhost:3001/api/docs"
              target="_blank"
              rel="noreferrer"
              className={s.ctaSecondary}
            >
              View API docs <LuArrowRight size={16} />
            </a>
          </div>

          {/* Interactive Fake product screenshot */}
          <DemoCard />
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section className={s.features}>
        <p className={s.sectionLabel}>What's included</p>
        <h2 className={s.sectionTitle}>Everything you'd build anyway</h2>
        <p className={s.sectionSubtitle}>
          Stop reinventing auth and billing. These are the hard parts — they're already done.
        </p>

        <div className={s.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={s.featureCard}>
              <div className={s.featureIcon} style={{ background: f.bg }}>
                <f.Icon size={22} color={f.iconColor} strokeWidth={1.75} />
              </div>
              <div className={s.featureTitle}>{f.title}</div>
              <p className={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech Stack ───────────────────────────────────────────── */}
      <section className={s.stack}>
        <p className={s.sectionLabel}>Built on</p>
        <h2 className={s.sectionTitle}>A stack you already know</h2>
        <p className={s.sectionSubtitle}>
          No magic frameworks. Just the most battle-tested tools in the Node.js ecosystem.
        </p>
        <div className={s.marqueeContainer}>
          <div className={s.marqueeTrack}>
            {/* First set */}
            {STACK.map((tech) => (
              <div key={tech.name} className={s.stackChip}>
                <tech.Icon size={24} color={tech.color} />
                <span>{tech.name}</span>
              </div>
            ))}
            {/* Duplicated set for seamless infinite scrolling */}
            {STACK.map((tech) => (
              <div key={`${tech.name}-dup`} className={s.stackChip}>
                <tech.Icon size={24} color={tech.color} />
                <span>{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ───────────────────────────────────────────── */}
      <div className={s.ctaBanner}>
        <h2 className={s.ctaBannerTitle}>Ready to stop rebuilding auth?</h2>
        <p className={s.ctaBannerSub}>Clone the repo, run docker-compose up, and you're live in under 5 minutes.</p>
        <Link href={ROUTES.signup} className={s.ctaBannerBtn}>
          Create your account <LuArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
