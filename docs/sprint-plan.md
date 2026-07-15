# 10-Day Sprint Plan — Full-Stack SaaS Boilerplate

> **Goal**: Ship a production-grade, full-stack SaaS Boilerplate in 10 days.
> **Stack**: NestJS · PostgreSQL · Prisma · Redis · Next.js · Docker · Stripe
> **Pace**: 6–8 hours/day · 1 PR/day · ~45 features total

---

## Git Workflow (Apply Every Single Day)

```bash
# Morning — start a new branch from main
git checkout main && git pull
git checkout -b day-XX/<short-name>

# Evening — commit and push everything
git add .
git commit -m "feat: day XX — <what you built today>"
git push origin day-XX/<short-name>
# Open PR on GitHub → Squash & Merge → Done
```

### Commit Message Convention (Conventional Commits)

```bash
feat(auth): add argon2 password hashing
fix(proxy): handle expired JWT redirect
chore(monorepo): initialize nx workspace
docs(readme): add local dev setup instructions
```

---

## Sprint Overview

| Day | Branch                         | Focus                                             | Difficulty |
| --- | ------------------------------ | ------------------------------------------------- | ---------- |
| 1   | `day-01/foundation`            | Monorepo + Docker + Prisma Schema                 | 🟡 Medium  |
| 2   | `day-02/apps-bootstrap`        | NestJS + Next.js Bootstrap + Design System        | 🟡 Medium  |
| 3   | `day-03/auth-backend`          | Full Authentication Backend (7 endpoints)         | 🔴 Hard    |
| 4   | `day-04/auth-frontend`         | Orval + BFF + Full Auth UI                        | 🔴 Hard    |
| 5   | `day-05/multitenancy-backend`  | Organizations + RBAC + Audit Logging              | 🔴 Hard    |
| 6   | `day-06/multitenancy-frontend` | Dashboard + App Shell + Org Switcher + Onboarding | 🔴 Hard    |
| 7   | `day-07/adapters`              | BullMQ + Email Adapter + Storage Adapter          | 🟡 Medium  |
| 8   | `day-08/uploads-profile`       | File Upload UI + Profile Settings + PlanGate      | 🟡 Medium  |
| 9   | `day-09/billing`               | Stripe Checkout + Webhooks + Billing UI           | 🔴 Hard    |
| 10  | `day-10/quality-launch`        | Tests + CI/CD + README                            | 🟡 Medium  |

---

## Day 1 — Monorepo + Docker + Database Foundation

**Branch**: `day-01/foundation`

### Tasks

- [ ] Initialize npm workspaces with `"workspaces": ["apps/*", "packages/*"]` in root `package.json`
- [ ] Configure NX: install `nx`, `@nx/nest`, `@nx/next`, `@nx/js` and create `nx.json`
- [ ] Scaffold directory structure:
  - `apps/api/`, `apps/web/`
  - `packages/database/`, `packages/ui/`, `packages/types/`, `packages/env/`
  - `packages/eslint-config/`, `packages/tsconfig/`
- [ ] Write `docker-compose.yml` — Postgres + Redis on a private Docker network
- [ ] Write complete Prisma schema (`packages/database/prisma/schema.prisma`)
  - Models: `User`, `RefreshToken`, `PasswordResetToken`, `EmailVerificationToken`
  - Models: `Organization`, `OrgMember`, `Invitation`, `Subscription`, `AuditLog`
  - Enums: `OrgRole`, `SubscriptionStatus`
  - Soft deletes: `deletedAt` on `User` and `Organization`
  - Indexes: `OrgMember.userId`, `OrgMember.organizationId`, `AuditLog.organizationId`, `AuditLog.createdAt`
- [ ] Run `prisma migrate dev --name init` and confirm all tables created
- [ ] Export types ONLY from `packages/database/index.ts` (no `PrismaClient` export)
- [ ] Write `.env.example` with all required variable names
- [ ] Write root `.gitignore`

### Deliverable

> Running Postgres + Redis via Docker. Full DB schema migrated and validated.

---

## Day 2 — Both Apps Bootstrapped + Design System

**Branch**: `day-02/apps-bootstrap`

### Tasks

- [ ] **NestJS** (`apps/api`):
  - Bootstrap with `@nestjs/cli`
  - Wire `PrismaService` (instantiates `PrismaClient` here only)
  - Configure `@nestjs/config` with `joi` schema validation
  - Set up `nestjs-pino` for structured logging
  - Apply global `Helmet`, CORS, `ThrottlerGuard`
  - Set API versioning prefix `/api/v1`
  - Build `HealthModule` → `GET /health` (checks Prisma + Redis)
- [ ] **Next.js** (`apps/web`):
  - Bootstrap with App Router, TypeScript, `src/` folder
  - Configure `@` alias in `tsconfig.json`: `{ "@/*": ["./src/*"] }`
  - Scaffold all empty directories: `hooks/`, `providers/`, `constants/`, `types/`, `actions/`
  - Scaffold all route group folders: `(marketing)/`, `(auth)/`, `(app)/`, `invite/[token]/`
- [ ] **Design System** (`packages/ui/styles/`):
  - `tokens.css`: CSS Variables for color palette (dark/light), spacing scale (4px base), radii, shadows, z-index layers
  - `reset.css`: Modern CSS reset
  - `typography.css`: Font face (Geist/Inter), typographic scale (sm → 5xl)
  - Import all three in Next.js `globals.css`
- [ ] Configure `nx run-many --target=serve --all --parallel` to run both `api` and `web` simultaneously

### Deliverable

> `nx run-many --target=serve --all` starts both servers. `/health` returns `{ status: "ok" }`. Design tokens visible in browser.

---

## Day 3 — Full Authentication Backend

**Branch**: `day-03/auth-backend`

> [!WARNING]
> This is the hardest backend day. Start early.

### Tasks

- [ ] `POST /api/v1/auth/register`
  - Hash password with `argon2`
  - Create `User` with `emailVerified: false`
  - Generate `EmailVerificationToken` (random bytes → hash → store)
  - Enqueue email job (stub the queue for now — Day 7 wires it up)
- [ ] `POST /api/v1/auth/login`
  - Validate credentials with `argon2.verify()`
  - Issue short-lived access JWT (15 min)
  - Generate refresh token → hash → store in `RefreshToken` table
  - Set refresh token in `httpOnly`, `Secure`, `SameSite=Strict` cookie
- [ ] `POST /api/v1/auth/refresh`
  - Read cookie, find hashed token in DB
  - Validate not expired → issue new access JWT
  - Rotate refresh token (delete old, create new)
- [ ] `POST /api/v1/auth/logout`
  - Delete `RefreshToken` from DB
  - Clear the cookie
- [ ] `GET /api/v1/auth/verify-email?token=`
  - Find `EmailVerificationToken` by hash
  - Validate `expiresAt` → set `User.emailVerified = true`
  - Delete used token
- [ ] `POST /api/v1/auth/forgot-password`
  - Generate `PasswordResetToken` → hash → store
  - Enqueue reset email job (stubbed)
- [ ] `POST /api/v1/auth/reset-password`
  - Validate `PasswordResetToken` → update `User.passwordHash`
  - Delete all `RefreshToken`s for user (force re-login everywhere)
- [ ] Configure `JwtStrategy` with Passport
- [ ] Decorate all endpoints with Swagger `@ApiTags`, `@ApiOperation`, `@ApiResponse`

### Deliverable

> All 7 auth endpoints working, testable via Swagger UI at `/api/docs`.

---

## Day 4 — Orval + BFF + Full Auth UI

**Branch**: `day-04/auth-frontend`

> [!WARNING]
> This is the hardest frontend day. Wire carefully.

### Tasks

- [ ] Configure Orval to read NestJS Swagger JSON, generate typed fetch client → `src/lib/api/client.ts`
- [ ] Implement `src/lib/auth.ts` — `getAccessToken()`, `setTokenCookie()`, `clearCookies()` (server-only helpers)
- [ ] Implement `src/lib/proxy.ts` — reads JWT cookie, validates with NestJS, calls `redirect(ROUTES.LOGIN)` on failure
- [ ] Wire `await proxy()` call at top of `src/app/(app)/layout.tsx`
- [ ] Implement `src/constants/routes.ts` — `ROUTES.LOGIN`, `ROUTES.DASHBOARD`, etc.
- [ ] Implement `src/providers/auth-provider.tsx` and `src/providers/theme-provider.tsx`
- [ ] Write Server Actions in `src/actions/auth.actions.ts`:
  - `loginAction()`, `registerAction()`, `logoutAction()`
  - `forgotPasswordAction()`, `resetPasswordAction()`
- [ ] Build UI pages with CSS Modules + Framer Motion entrance animations:
  - `(auth)/login/page.tsx`
  - `(auth)/register/page.tsx`
  - `(auth)/forgot-password/page.tsx`
  - `(auth)/reset-password/page.tsx`
  - `(auth)/verify-email/page.tsx`
- [ ] Implement Zod form validation on all auth forms

### Deliverable

> Full auth flow works in browser: Register → Verify Email → Login → Redirect to app → Logout.

---

## Day 5 — Full Multi-Tenancy Backend

**Branch**: `day-05/multitenancy-backend`

### Tasks

- [ ] **Organizations API**:
  - `POST /api/v1/orgs` — create org (auto-generate slug, auto-create `OrgMember` as `OWNER`)
  - `GET /api/v1/orgs/:slug` — get org details
  - `PATCH /api/v1/orgs/:id` — update org (name, logo)
  - `GET /api/v1/orgs/my` — list all orgs for the current user
- [ ] **Invitations API**:
  - `POST /api/v1/orgs/:id/invitations` — create `Invitation`, enqueue email (stubbed)
  - `POST /api/v1/orgs/invitations/accept` — consume token, create `OrgMember`
  - `DELETE /api/v1/orgs/:id/members/:memberId` — remove a member
- [ ] **RBAC Guards**:
  - `JwtAuthGuard` — applied globally (use `@Public()` to opt-out)
  - `OrgRolesGuard` — checks `OrgMember.role` for `@OrgRoles(OrgRole.ADMIN)` decorator
  - `PlanGuard` — checks `subscription.planId` for `@RequirePlan('pro')` decorator
- [ ] **Exception Filters**:
  - `PrismaClientExceptionFilter` — maps Prisma P-codes to HTTP status codes
  - `AllExceptionsFilter` — global fallback with structured error shape
- [ ] **Audit Logging**: Wire `AuditLogService` into auth + org actions

### Deliverable

> Full org + invitation + RBAC system live. Testable via Swagger.

---

## Day 6 — Full Multi-Tenancy Frontend

**Branch**: `day-06/multitenancy-frontend`

> [!WARNING]
> This is the hardest frontend day. Tackle the App Shell first.

### Tasks

- [ ] **App Shell** (`src/components/layouts/app-shell/`):
  - `sidebar.tsx` with nav items, active state, org branding
  - `header.tsx` with breadcrumbs + user menu
  - `app-shell.module.css` with Glassmorphism sidebar backdrop-filter
- [ ] **Providers & Hooks**:
  - `src/providers/org-provider.tsx` — `OrgProvider` + `useOrg()` context
  - `src/hooks/use-current-org.ts` — reads `orgSlug` from `useParams()`
  - `src/hooks/use-current-user.ts` — reads user from `AuthContext`
  - `src/hooks/use-plan.ts` — `isPro()`, `isFree()` helpers
- [ ] **Org Switcher** (`src/components/blocks/org-switcher/`):
  - Radix UI `DropdownMenu` + custom CSS
  - Lists all user's orgs, switches active org by navigating to `/{slug}/dashboard`
- [ ] **Routes & Layout**:
  - `src/app/(app)/[orgSlug]/layout.tsx` — fetches org, injects `OrgProvider`
  - `src/app/(app)/[orgSlug]/dashboard/page.tsx` — RSC data fetch
  - `src/app/(app)/[orgSlug]/dashboard/loading.tsx` — skeleton
  - `src/app/(app)/[orgSlug]/dashboard/error.tsx` — error boundary
  - `src/app/(app)/[orgSlug]/settings/` — general, members pages
- [ ] **Onboarding Wizard** (`src/components/blocks/onboarding-wizard/`):
  - Step 1: Set display name + avatar
  - Step 2: Create first org (name → auto slug preview)
  - Step 3: Invite team members (optional, skippable)
  - On complete: call `orgs.actions.ts`, set `onboardingComplete`, redirect to dashboard
- [ ] **Invitation Page**: `src/app/invite/[token]/page.tsx` — accept invitation flow
- [ ] Wire `orgs.actions.ts` Server Actions to the Orval client

### Deliverable

> Full authenticated app works: Login → Onboarding → Dashboard → Org Switcher → Settings.

---

## Day 7 — BullMQ + Email & Storage Adapters

**Branch**: `day-07/adapters`

### Tasks

- [ ] **BullMQ Setup**:
  - Configure `@nestjs/bullmq` with Redis in `QueueModule`
  - Define queue names as constants
- [ ] **Email Adapter (Ports & Adapters Pattern)**:
  - `IMailService` interface with `sendMail(to, subject, html)` method
  - `ResendEmailAdapter` — wraps Resend SDK (production)
  - `NodemailerEmailAdapter` — wraps Nodemailer SMTP (local dev)
  - Swap via `EMAIL_PROVIDER` env variable in `MailModule`
- [ ] **Email Templates** (HTML strings):
  - `verify-email.template.ts`
  - `reset-password.template.ts`
  - `invitation.template.ts`
- [ ] **Wire Email Worker**: Connect `auth-email.worker.ts` BullMQ consumer to `IMailService` — emails from Day 3 now actually send
- [ ] **Storage Adapter (Ports & Adapters Pattern)**:
  - `IStorageService` interface with `upload(file, key)`, `delete(key)`, `getUrl(key)` methods
  - `S3StorageAdapter` — wraps AWS SDK v3 (production)
  - `LocalStorageAdapter` — saves to `/uploads` disk folder (local dev)
  - Swap via `STORAGE_PROVIDER` env variable in `StorageModule`
- [ ] `POST /api/v1/uploads/avatar` endpoint using Multer + `IStorageService`

### Deliverable

> Emails send on register/verify/reset. Files upload to local disk. Both adapters swap via env var.

---

## Day 8 — File Upload UI + Profile Settings + PlanGate

**Branch**: `day-08/uploads-profile`

### Tasks

- [ ] **Avatar Upload Component**:
  - Drag-and-drop zone using `react-dropzone`
  - Image preview with circular crop display
  - Upload progress bar (CSS animation)
  - Remove / replace button
  - Wire to `users.actions.ts` → `POST /uploads/avatar`
- [ ] **Profile Settings Page** (`[orgSlug]/settings/page.tsx`):
  - Display name, avatar upload, timezone
  - Danger zone: delete account
- [ ] **Toast Notification System**:
  - Custom CSS toast component
  - Success / error / loading states
  - Used across all form submissions
- [ ] **`<PlanGate>` Component** (`src/components/blocks/billing-portal/plan-gate.tsx`):
  - Accepts `plan="pro"` prop
  - If current plan doesn't match: renders upgrade nudge UI instead of children
  - Uses `usePlan()` hook internally
- [ ] Wire `PlanGate` into Members settings page (limit members on free plan)

### Deliverable

> Avatar upload works end-to-end. Profile updates save. PlanGate blocks/allows features correctly.

---

## Day 9 — Stripe Full-Stack (Checkout + Webhooks + Billing UI)

**Branch**: `day-09/billing`

> [!WARNING]
> Raw body parsing for Stripe webhooks is the trickiest part. Do the backend before the frontend.
> Use `stripe listen --forward-to localhost:3000/api/v1/billing/webhook` for local testing.

### Tasks

- [ ] **Backend**:
  - Wire Stripe SDK into `BillingModule` via config
  - `POST /api/v1/billing/checkout` — create Stripe Checkout Session, return URL
  - `POST /api/v1/billing/portal` — open Stripe Customer Billing Portal
  - `StripeWebhookController` — **isolated** raw body parsing in `main.ts` for this route only
  - Webhook handlers:
    - `invoice.paid` → set `Subscription.status = ACTIVE`
    - `customer.subscription.deleted` → set `status = CANCELED`
    - `customer.subscription.updated` → sync `planId`, `currentPeriodEnd`
- [ ] **Frontend**:
  - `billing.actions.ts` — `createCheckoutAction()`, `openPortalAction()`
  - Pricing page (`(marketing)/pricing/page.tsx`): animated plan comparison cards
  - Handle Stripe return URL: `?success=true` / `?canceled=true` toast states
  - Settings → Billing page: current plan, `currentPeriodEnd`, Manage button

### Deliverable

> Full billing cycle: Select plan → Checkout → Pay → Webhook → DB updated → UI reflects new plan.

---

## Day 10 — Tests + CI/CD + README

**Branch**: `day-10/quality-launch`

### Tasks

- [ ] **Backend E2E Tests** (Supertest):
  - `auth.e2e-spec.ts`: Register → verify email → login → refresh → logout
  - `orgs.e2e-spec.ts`: Create org → invite member → accept invitation
  - `plan-guard.e2e-spec.ts`: Free user blocked from Pro-only endpoint
- [ ] **Frontend Component Tests** (Vitest + React Testing Library):
  - `proxy.test.ts`: Redirects unauthenticated requests
  - `plan-gate.test.tsx`: Renders children / upgrade nudge based on plan
  - `use-plan.test.ts`: Returns correct `isPro()` from mock context
- [ ] **GitHub Actions CI/CD** (`.github/workflows/ci.yml`):
  ```yaml
  npm ci
  → nx run-many --target=lint --all
  → nx run-many --target=test --all
  → prisma migrate deploy
  → nx run-many --target=build --all
  → docker build + push to GHCR
  ```
- [ ] Store all secrets as GitHub Actions Secrets
- [ ] **README.md**: Overview, prerequisites, local setup, env variables, NX scripts

### Deliverable

> Tests pass. CI pipeline is green. Full product ships. 🚀

---

## Risk Mitigation

| Risk                               | Mitigation                                                             |
| ---------------------------------- | ---------------------------------------------------------------------- |
| Day 3 or 6 runs long               | Push email stubs (Day 3) and onboarding wizard (Day 6) to Day 7/8      |
| Stripe webhooks don't work locally | Use `stripe listen --forward-to localhost:3000/api/v1/billing/webhook` |
| Orval generation fails             | Keep a manual typed fetch wrapper as fallback for auth actions         |
| Behind on Day 5                    | Ship basic org CRUD only, defer invitation email to Day 7              |

---

## Daily Shutdown Checklist

Before closing your laptop every night:

- [ ] All code committed and pushed to remote branch
- [ ] PR is open on GitHub
- [ ] No console errors in dev server
- [ ] `.env.example` updated if new env vars were added
- [ ] PR merged to `main` before sleeping
