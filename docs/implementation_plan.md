# Complete Full-Stack SaaS Boilerplate — Definitive Implementation Plan

This document is the final, production-grade blueprint for an enterprise-grade, full-stack SaaS Boilerplate. All prior validation gaps have been patched.

---

## 1. Architecture & Design Principles

### The "Hybrid BFF" Design Pattern

We implement a **Hybrid BFF** pattern using Next.js Server Actions and React Server Components (RSC):

- **Data Fetching (Reads)**: RSC fetches data from NestJS during SSR — instant loads, perfect SEO.
- **Data Mutations (Writes)**: Next.js Server Actions act as the BFF layer.
  - _Flow:_ Browser → Next.js Server Action → NestJS API
  - The Next.js server holds `httpOnly` JWT cookies and forwards them to NestJS. The browser never sees the raw JWT.
- **Network Isolation**: NestJS lives in a private Docker network, only reachable by the Next.js server. Never exposed to the public internet.
- **URL-based Org Context**: Active organization is encoded in the URL as `[orgSlug]` (e.g., `/acme-corp/dashboard`). Deep-linkable, shareable, and avoids fragile header-based tenant detection.

### Tech Stack

| Layer           | Technology                                                    |
| --------------- | ------------------------------------------------------------- |
| Backend API     | NestJS, PostgreSQL, Prisma, Redis, BullMQ, Docker             |
| Frontend        | Next.js 14+ (App Router), React, TypeScript                   |
| API Type Safety | Orval (auto-generates typed fetch client from NestJS Swagger) |
| Design System   | Vanilla CSS (CSS Modules), Radix UI (headless), Framer Motion |
| Package Manager | npm workspaces + NX                                           |

---

## 2. Folder Structures

### 2A. Root Monorepo

```text
/
├── apps/
│   ├── api/                     # NestJS Backend
│   └── web/                     # Next.js Frontend
├── packages/
│   ├── database/                # Prisma schema + generated TYPES only (NOT PrismaClient)
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── index.ts             # Re-exports Prisma types only
│   │   └── package.json
│   ├── ui/                      # Shared design tokens + base CSS
│   │   ├── styles/
│   │   │   ├── tokens.css       # CSS Variables (colors, spacing, radii, shadows)
│   │   │   ├── reset.css        # Global CSS reset
│   │   │   └── typography.css   # Font face, typographic scale
│   │   └── package.json
│   ├── types/                   # Shared Zod schemas (API contracts)
│   │   ├── auth.schema.ts
│   │   ├── org.schema.ts
│   │   └── package.json
│   ├── env/                     # t3-env validation per app
│   │   ├── api.ts
│   │   ├── web.ts
│   │   └── package.json
│   ├── eslint-config/           # Shared ESLint rules
│   └── tsconfig/                # Shared TS base configs
├── docker-compose.yml           # All services with isolated Docker networks
├── turbo.json                   # Turborepo v2 task pipeline
├── pnpm-workspace.yaml
└── .env.example
```

**Turborepo v2 Pipeline (`turbo.json`)**

> [!WARNING]
> Turborepo v2+ uses `"tasks"` NOT `"pipeline"`. The old key is silently ignored and builds will not cache.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

---

### 2B. NestJS Backend (`apps/api/`)

```text
apps/api/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── current-org.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   ├── all-exceptions.filter.ts
│   │   │   └── prisma-exception.filter.ts     # Maps Prisma P-codes to HTTP errors
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── org-roles.guard.ts
│   │   │   └── plan.guard.ts                  # @RequirePlan('pro') feature gating
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts       # Standardizes all API response shapes
│   │   └── pipes/
│   │       └── zod-validation.pipe.ts
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── stripe.config.ts
│   │
│   ├── core/
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts              # PrismaClient instantiation lives HERE only
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts
│   │   ├── mail/
│   │   │   ├── interfaces/
│   │   │   │   └── mail-service.interface.ts  # IMailService (Port)
│   │   │   ├── adapters/
│   │   │   │   ├── resend.adapter.ts          # Production
│   │   │   │   └── nodemailer.adapter.ts      # Local/test
│   │   │   ├── templates/
│   │   │   │   ├── verify-email.template.ts
│   │   │   │   ├── reset-password.template.ts
│   │   │   │   └── invitation.template.ts
│   │   │   └── mail.module.ts
│   │   └── storage/
│   │       ├── interfaces/
│   │       │   └── storage-service.interface.ts  # IStorageService (Port)
│   │       ├── adapters/
│   │       │   ├── s3.adapter.ts              # Production
│   │       │   └── local.adapter.ts           # Local dev
│   │       └── storage.module.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── forgot-password.dto.ts
│   │   │   │   └── reset-password.dto.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── workers/
│   │   │   │   └── auth-email.worker.ts       # BullMQ consumer for auth emails
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/
│   │   │   ├── dto/
│   │   │   │   └── update-user.dto.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── organizations/
│   │   │   ├── dto/
│   │   │   │   ├── create-org.dto.ts
│   │   │   │   ├── update-org.dto.ts
│   │   │   │   └── invite-member.dto.ts
│   │   │   ├── organizations.controller.ts
│   │   │   ├── organizations.service.ts
│   │   │   └── organizations.module.ts
│   │   ├── billing/
│   │   │   ├── dto/
│   │   │   │   └── create-checkout.dto.ts
│   │   │   ├── billing.controller.ts          # Protected routes
│   │   │   ├── stripe-webhook.controller.ts   # Public, raw body, signature verified
│   │   │   ├── billing.service.ts
│   │   │   └── billing.module.ts
│   │   ├── uploads/
│   │   │   ├── uploads.controller.ts
│   │   │   ├── uploads.service.ts
│   │   │   └── uploads.module.ts
│   │   └── health/
│   │       ├── health.controller.ts           # GET /health - checks Prisma + Redis
│   │       └── health.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts                                # Bootstrap: /api/v1, Helmet, CORS, Swagger
│
├── test/
│   ├── auth.e2e-spec.ts
│   ├── orgs.e2e-spec.ts
│   └── jest-e2e.json
├── Dockerfile
└── package.json
```

---

### 2C. Next.js Frontend (`apps/web/`)

> [!IMPORTANT]
> **All source code lives under `src/`**. This is required for the `@` alias (`"@/*": ["./src/*"]`) to resolve correctly at runtime. Without `src/`, the alias breaks.

```text
apps/web/
├── public/                              # Static assets (never import via @)
│   ├── favicon.ico
│   ├── logo.svg
│   └── og-image.png                     # Default OpenGraph image
│
├── src/
│   ├── app/
│   │   ├── (marketing)/                 # Public route group — no auth
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx               # Public header/footer layout
│   │   │
│   │   ├── (auth)/                      # Auth route group — centered card layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx             # Lands here from email verify link
│   │   │   └── layout.tsx               # Auth layout (centered card, gradient bg)
│   │   │
│   │   ├── invite/
│   │   │   └── [token]/
│   │   │       └── page.tsx             # Public invitation acceptance page
│   │   │
│   │   ├── (app)/
│   │   │   ├── layout.tsx               # App shell + calls proxy() — first defence line
│   │   │   ├── onboarding/
│   │   │   │   ├── page.tsx             # Welcome Wizard (redirects if onboardingComplete)
│   │   │   │   └── loading.tsx
│   │   │   └── [orgSlug]/               # Renders INSIDE (app)/layout.tsx automatically
│   │   │       ├── layout.tsx           # Loads org data, validates membership, wraps OrgProvider
│   │   │       ├── dashboard/
│   │   │       │   ├── page.tsx         # RSC: fetches data server-side
│   │   │       │   ├── loading.tsx      # Skeleton loader shown during RSC fetch
│   │   │       │   └── error.tsx        # Error boundary for this route
│   │   │       └── settings/
│   │   │           ├── layout.tsx       # Settings sub-nav layout
│   │   │           ├── page.tsx         # General settings (org name, logo)
│   │   │           ├── members/
│   │   │           │   ├── page.tsx
│   │   │           │   └── loading.tsx
│   │   │           └── billing/
│   │   │               ├── page.tsx
│   │   │               └── loading.tsx
│   │   │
│   │   ├── api/
│   │   │   └── health/
│   │   │       └── route.ts
│   │   │
│   │   ├── error.tsx                    # Global unhandled error fallback
│   │   ├── not-found.tsx                # Global 404
│   │   ├── layout.tsx                   # Root layout: fonts, ThemeProvider, AuthProvider
│   │   └── globals.css                  # @import packages/ui styles
│   │
│   ├── actions/                         # Server Actions — BFF layer (server-only)
│   │   ├── auth.actions.ts              # login, register, logout, refreshToken
│   │   ├── users.actions.ts             # updateProfile, uploadAvatar
│   │   ├── orgs.actions.ts              # createOrg, inviteMember, acceptInvitation
│   │   └── billing.actions.ts           # createCheckout, openBillingPortal
│   │
│   ├── components/
│   │   ├── blocks/                      # Feature-specific composed UI blocks
│   │   │   ├── onboarding-wizard/
│   │   │   │   ├── wizard.tsx
│   │   │   │   └── wizard.module.css
│   │   │   ├── org-switcher/
│   │   │   │   ├── org-switcher.tsx     # Radix DropdownMenu + custom CSS
│   │   │   │   └── org-switcher.module.css
│   │   │   └── billing-portal/
│   │   │       ├── plan-gate.tsx        # <PlanGate plan="pro"> wrapper
│   │   │       └── pricing-table.tsx
│   │   ├── layouts/
│   │   │   ├── app-shell/
│   │   │   │   ├── app-shell.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── header.tsx
│   │   │   │   └── app-shell.module.css
│   │   │   └── auth-layout/
│   │   │       ├── auth-layout.tsx
│   │   │       └── auth-layout.module.css
│   │   └── ui/                          # Consumed from packages/ui
│   │
│   ├── hooks/                           # Client-side React hooks
│   │   ├── use-current-user.ts          # Reads user from AuthContext
│   │   ├── use-current-org.ts           # Reads orgSlug from useParams()
│   │   └── use-plan.ts                  # isPro(), isFree() helpers
│   │
│   ├── providers/                       # React Context providers ('use client')
│   │   ├── auth-provider.tsx            # Session context
│   │   ├── org-provider.tsx             # Active org context (loaded in [orgSlug]/layout)
│   │   └── theme-provider.tsx           # Dark/light mode
│   │
│   ├── types/                           # Frontend-only TypeScript types
│   │   ├── ui.types.ts                  # Form states, modal states, component props
│   │   └── nav.types.ts                 # Sidebar nav item shape
│   │
│   ├── constants/                       # App-wide constants — no magic strings anywhere
│   │   ├── routes.ts                    # ROUTES.LOGIN, ROUTES.DASHBOARD etc.
│   │   ├── plans.ts                     # PLANS.PRO = { label, price, features[] }
│   │   └── api.ts                       # API_BASE_URL
│   │
│   └── lib/
│       ├── api/
│       │   └── client.ts                # Orval-generated typed fetch client
│       ├── proxy.ts                     # Auth validation utility — called from (app)/layout.tsx
│       ├── auth.ts                      # httpOnly cookie helpers (server-only)
│       └── utils.ts                     # formatDate(), cn() and pure utilities
│
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

**`@` Path Alias (`tsconfig.json`)**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Import Rules**:

```ts
// Always use @ alias
import { proxy } from "@/lib/proxy";
import { ROUTES } from "@/constants/routes";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { loginAction } from "@/actions/auth.actions";

// Never use deep relative paths
import { proxy } from "../../../lib/proxy"; // forbidden
```

---

**How `proxy.ts` is Invoked**

`proxy.ts` is NOT a standalone file. It is a utility function called at the top of `(app)/layout.tsx` (a Server Component). Since every protected page renders through this layout, auth validation runs automatically.

```ts
// src/app/(app)/layout.tsx
import { proxy } from '@/lib/proxy';
import { AppShell } from '@/components/layouts/app-shell/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await proxy(); // Reads JWT cookie, validates with NestJS, calls redirect('/login') on failure
  return <AppShell>{children}</AppShell>;
}
```

---

**Nested Layout Composition**

Next.js composes layouts automatically by nesting. Do NOT re-render the sidebar inside `[orgSlug]/layout.tsx`.

```text
Root layout.tsx          (fonts, ThemeProvider, AuthProvider)
  (app)/layout.tsx       (App Shell: Sidebar + Header + proxy() call)
    [orgSlug]/layout.tsx (loads org, injects OrgProvider — no sidebar here)
      dashboard/page.tsx (the actual page content)
```

---

## 3. Database Schema (Prisma)

_(In `packages/database/prisma/schema.prisma`)_

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                      String                   @id @default(uuid())
  email                   String                   @unique
  emailVerified           Boolean                  @default(false)
  passwordHash            String
  name                    String?
  avatarUrl               String?
  memberships             OrgMember[]
  refreshTokens           RefreshToken[]
  passwordResetTokens     PasswordResetToken[]
  emailVerificationTokens EmailVerificationToken[]
  onboardingComplete      Boolean                  @default(false)
  createdAt               DateTime                 @default(now())
  updatedAt               DateTime                 @updatedAt
  deletedAt               DateTime?
}

model RefreshToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model EmailVerificationToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Organization {
  id               String        @id @default(uuid())
  name             String
  slug             String        @unique
  logoUrl          String?
  members          OrgMember[]
  invitations      Invitation[]
  subscription     Subscription?
  stripeCustomerId String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  deletedAt        DateTime?
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
}

model OrgMember {
  id             String       @id @default(uuid())
  userId         String
  organizationId String
  role           OrgRole      @default(MEMBER)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())

  @@unique([userId, organizationId])
  @@index([userId])
  @@index([organizationId])
}

model Invitation {
  id             String       @id @default(uuid())
  email          String
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role           OrgRole
  token          String       @unique
  expiresAt      DateTime
  createdAt      DateTime     @default(now())

  @@unique([email, organizationId])
}

enum SubscriptionStatus {
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELED
  INCOMPLETE
}

model Subscription {
  id                   String             @id @default(uuid())
  organizationId       String             @unique
  organization         Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  planId               String
  status               SubscriptionStatus
  stripeSubscriptionId String?            @unique
  currentPeriodEnd     DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
}

model AuditLog {
  id             String   @id @default(uuid())
  organizationId String
  userId         String
  action         String
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([organizationId])
  @@index([createdAt])
}
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Monorepo, Docker, Shared Packages)

- Initialize `pnpm` workspaces and `turbo.json` with Turborepo v2 `tasks` syntax.
- Initialize `packages/database` (Prisma schema + type-only exports).
- Initialize `packages/ui` (CSS Variables, reset, typography).
- Configure `docker-compose.yml` with a private Docker network for NestJS.
- Bootstrap NestJS with API versioning (`/api/v1`), Helmet, CORS, global Throttler.
- Bootstrap Next.js with `src/` folder, CSS imports, Radix UI, Framer Motion.
- Scaffold all `constants/`, `hooks/`, `providers/` directories with placeholder files.

### Phase 2: Complete Auth & BFF Architecture

- Backend: `argon2` hashing, JWT access/refresh strategy.
- Backend: All token flows — Email Verification, Password Reset, Refresh.
- Orval: Configure to read NestJS Swagger and generate typed API client.
- Frontend: Implement `proxy.ts` utility and wire into `(app)/layout.tsx`.
- Frontend: Login, Signup, Forgot Password, Reset Password, Verify Email pages.

### Phase 3: Dashboard, Multi-Tenancy & Feature Gating

- Backend: Organizations, Invitations, RBAC Guards, Audit Logging.
- Backend: `@RequirePlan('pro')` guard for billing-gated routes.
- Frontend: App Shell (Sidebar, Header), `[orgSlug]` URL pattern, OrgProvider.
- Frontend: `<PlanGate>` component, `usePlan()` hook.
- Frontend: Onboarding Wizard, Invitation acceptance page (`/invite/[token]`).

### Phase 4: SaaS Features (Adapters & Billing)

- Backend: BullMQ queue, Email Adapter (Resend/Nodemailer), Storage Adapter (S3/Local).
- Frontend: Drag-and-drop avatar upload, toast notifications.
- Stripe: Checkout sessions, Webhook controller (isolated raw body parsing).
- Frontend: Animated Pricing page, Stripe Checkout integration.

### Phase 5: Verification, CI/CD & Deployment

- **DB Migration**: `prisma migrate deploy` runs as a pre-boot entrypoint in Docker.
- Backend: E2E tests — auth flows, refresh cycle, plan gating, invitation acceptance.
- Frontend: Vitest + React Testing Library for component tests.
- CI/CD: GitHub Actions — lint → test → migrate → build → push Docker image.
