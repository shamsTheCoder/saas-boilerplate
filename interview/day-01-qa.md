# SaaS Boilerplate — Interview Q&A (Day 1)

Everything we built, explained the way you'd talk through it in a real interview.

---

## Table of Contents
1. [Architecture & Design Pattern](#1-architecture--design-pattern)
2. [Tech Stack Decisions](#2-tech-stack-decisions)
3. [Monorepo & NX](#3-monorepo--nx)
4. [npm Workspaces](#4-npm-workspaces)
5. [Docker & Infrastructure](#5-docker--infrastructure)
6. [Prisma & Database Schema](#6-prisma--database-schema)
7. [Multi-Tenancy & RBAC](#7-multi-tenancy--rbac)
8. [Security Design](#8-security-design)
9. [Billing & Subscriptions](#9-billing--subscriptions)
10. [Sprint Planning & Git](#10-sprint-planning--git)

---

## 1. Architecture & Design Pattern

---

**Q: What architecture pattern did you use and why?**

We went with a "Hybrid BFF" — Backend for Frontend — pattern. The idea is that Next.js plays a dual role: it handles reads as a React Server Component (fetching data from NestJS during SSR), and it handles writes through Server Actions which act as the BFF layer. So the flow looks like: browser hits a Server Action, the Server Action calls NestJS, NestJS does the DB work and returns data, the Server Action sets cookies and redirects as needed. The browser never directly talks to NestJS.

The reason I chose this over a simple REST client in the browser is security — the JWT tokens live in httpOnly cookies on the Next.js server, so JavaScript running in the browser can never steal them. It also means NestJS can live in a completely private Docker network, never exposed to the internet.

---

**Q: What is the difference between a Server Action and a regular API route in Next.js?**

A Server Action is a function marked with `"use server"` that runs exclusively on the Next.js server. When a React form submits or a button calls it, Next.js handles the RPC internally — no explicit API route needed. The big advantage is that they're co-located with your UI, they have direct access to server-only resources like cookies and headers, and they automatically handle serialization. A regular API route (`route.ts`) is more like a traditional REST endpoint — it's more explicit but doesn't have the tight integration with React's form model. For mutations that come from UI interactions, Server Actions are cleaner. For webhooks or external integrations (like Stripe callbacks), we still use Route Handlers.

---

**Q: Why did you separate reads and writes architecturally?**

Reads and writes have different priorities. Reads need to be fast and cacheable — RSC lets us fetch data on the server during SSR, which means the page arrives pre-populated with data (great for performance and SEO). Writes need to be secure and validated — Server Actions give us a clean place to validate input, check auth, call NestJS, and handle errors before anything reaches the database. Mixing them together in one approach means you compromise on both. This way, RSC handles reads perfectly, and Server Actions handle writes perfectly.

---

**Q: How does network isolation work in your setup?**

In the `docker-compose.yml`, all services (Postgres, Redis, and eventually NestJS) are placed on a Docker bridge network called `internal`. This network is private — nothing outside Docker can reach it directly. Only the Next.js server, which talks to NestJS via an internal URL (`http://api:3001`), can access the API. The end user's browser can only reach the Next.js frontend on port 3000. NestJS has no public port bound to the host machine at all. This means even if someone finds the NestJS port, they can't hit it — it's simply not reachable from outside the Docker network.

---

**Q: What is URL-based org context and why did you choose it?**

Instead of storing the "currently active org" in a cookie or in-memory state, we encode it directly in the URL — `/acme-corp/dashboard`, `/other-company/settings`. The `[orgSlug]` is a dynamic Next.js route segment that tells the app which org context to load for that request. The benefits are: the URL is deep-linkable and shareable (a teammate can send you a link and you land in the right org), it works perfectly with browser back/forward navigation, it's stateless on the server side (no session needed to know which org you're viewing), and it's transparent to the user. The alternative — storing active org in a header or a session — is fragile and breaks when you share links or open the app in a new tab.

---

## 2. Tech Stack Decisions

---

**Q: Why NestJS for the backend instead of Express or Fastify?**

NestJS gives us a proper, structured application architecture out of the box. Express and Fastify are great, but they're essentially blank slates — you have to wire up dependency injection, modules, guards, interceptors, and pipes yourself. NestJS has all of that built in, and it follows Angular-like patterns that are very familiar to teams. The real wins for a SaaS boilerplate are: the module system forces clean separation of concerns, the guards and interceptors make auth and feature gating declarative (just add a decorator), and the Swagger integration is automatic. For a project that needs to scale across a team, NestJS is far more maintainable than a raw Express app.

---

**Q: Why Next.js 14 with the App Router specifically?**

The App Router is a fundamentally different model from the old Pages Router. React Server Components let you fetch data on the server without client-side waterfalls, which means faster initial page loads. Nested layouts mean you can share the app shell (sidebar, header) across many pages without remounting it. The `loading.tsx` and `error.tsx` conventions give you streaming UI and error boundaries with very little code. And Server Actions make form handling clean without needing a separate state management library for every mutation. All of these together make it the right choice for a production SaaS app.

---

**Q: Why TypeScript everywhere?**

The whole point of a shared monorepo is sharing types between frontend and backend. With TypeScript, the Prisma-generated types from the database can flow all the way through NestJS DTOs to Next.js components. If you change a field name in the schema, TypeScript catches every place that breaks — in the API, in the frontend, everywhere — at compile time, not at runtime in production. For a team working on a SaaS product, that is enormous.

---

**Q: Why Prisma over TypeORM or raw SQL?**

Prisma's schema-first approach is the key reason. You define your models in one `schema.prisma` file, run a migration, and Prisma generates a fully type-safe client. The types it generates exactly match your database shape — if a field is nullable in the schema, it's `string | null` in TypeScript, not just `string`. TypeORM uses decorators on classes which are more verbose and easier to get wrong. Raw SQL gives you full control but you lose all type safety on query results. Prisma hits the sweet spot — clean syntax, excellent TypeScript integration, and a great migration system.

---

**Q: Why Redis alongside PostgreSQL?**

Redis and Postgres serve completely different purposes here. Postgres is the source of truth — all our persistent data lives there. Redis is for speed-sensitive, ephemeral operations. In our case: BullMQ (our job queue for sending emails) uses Redis as its queue store, and we can use it later for caching frequently-read data (like org subscription status) to avoid hitting Postgres on every request. Using Redis for a queue is the industry standard — it's extremely fast at list operations, and BullMQ handles retries, delays, and concurrency on top of it beautifully.

---

## 3. Monorepo & NX

---

**Q: Why did you go with a monorepo instead of separate repos?**

The core reason is shared code. In a SaaS boilerplate, the frontend needs the same TypeScript types as the backend. The Prisma schema lives in one place and both apps reference it. Shared ESLint configs and TypeScript configs mean you set up best practices once. With separate repos, you'd be publishing npm packages or copying code — both of which are painful to keep in sync. A monorepo also simplifies CI/CD because one pipeline can build, test, and deploy all related code together.

---

**Q: Why NX specifically? What does it bring over just using npm workspaces alone?**

npm workspaces handle package resolution — they link local packages together so they can reference each other. But they don't know anything about how to build, test, or serve your code. NX adds a task runner on top. The big things NX gives us are: intelligent caching (if nothing changed in a package, NX skips running the build and uses the cached output), affected commands (only rebuild packages that changed), and first-class plugins for NestJS and Next.js that know how to start, build, and test those frameworks properly. Without NX, you'd still need to manually coordinate running `npm run build` in the right order across packages. NX figures that out automatically from the dependency graph.

---

**Q: Explain the `dependsOn: ["^build"]` in `nx.json`. What does the caret mean?**

The caret (`^`) means "all dependencies of this project." So when NX runs `build` for `apps/api`, it first looks at what packages `apps/api` depends on (like `packages/database`), and runs their `build` target first. Without the caret, NX would try to build the API before its dependencies are built, which would fail. The caret is shorthand for "build me only after everything I need is already built." This is how NX automatically enforces the right build order without you having to manually specify it.

---

**Q: What is `namedInputs` in `nx.json` and why does it matter?**

`namedInputs` are reusable sets of file patterns that tell NX what files to watch when deciding if a task's cache is still valid. The `default` input includes everything in the project root. The `production` input excludes test files and config files — this matters because if you only change a test file, NX knows the production build output hasn't changed, so it can use the cache for build but still re-run tests. Without named inputs, NX would conservatively invalidate the cache for everything whenever anything changed, which defeats the purpose of caching.

---

**Q: What NX plugins did you install and what do they do?**

We installed three: `@nx/next` which knows how to start the Next.js dev server, build for production, and integrate with NX's caching for Next.js-specific outputs. `@nx/nest` which does the same for NestJS — it knows how to compile TypeScript with the NestJS compiler and run the dev server with watch mode. And `@nx/js` which handles plain TypeScript packages like `packages/database`, `packages/types`, and `packages/ui`. Each plugin registers "inferred targets" — meaning NX can figure out how to build your app just by reading its config files, without you needing to write a lot of manual `project.json` configuration.

---

**Q: How do packages reference each other inside the monorepo?**

Through npm workspaces. Each package has a name like `@saas/database`. When `apps/api/package.json` lists `"@saas/database": "*"`, npm workspaces creates a symlink in `node_modules/@saas/database` that points directly to `packages/database` on disk. So when NestJS imports `from '@saas/database'`, it's actually importing the local TypeScript source, not a published npm package. The `*` version means "whatever is in the workspace." This is how you get live reloading across packages during development — change a type in `packages/database`, and both apps pick it up immediately.

---

## 4. npm Workspaces

---

**Q: Why did you use `"workspaces": ["apps/*", "packages/*"]` instead of listing each package individually?**

The glob pattern `apps/*` means "every directory inside `apps/`." This is a forward-looking choice — as we add more apps or packages, they automatically become part of the workspace without needing to update this config. Listing packages individually would mean you'd constantly forget to add new ones and hit cryptic resolution errors.

---

**Q: What is the `@saas` scope in package names like `@saas/database`?**

The `@saas` prefix is a namespace for all the packages in this monorepo. It serves two purposes: it avoids name collisions with public npm packages, and it makes imports visually obvious — when you see `from '@saas/database'`, you immediately know it's an internal package, not a third-party library. The scope is just a convention; it never gets published to npm because all these packages are `"private": true`.

---

## 5. Docker & Infrastructure

---

**Q: Walk me through the `docker-compose.yml` you built.**

We have two services running right now: `postgres` using the `postgres:16-alpine` image (alpine is smaller and more secure than the full image), and `redis` using `redis:7-alpine`. Both are on a private Docker bridge network called `internal`. Data is persisted in named volumes `postgres_data` and `redis_data` so it survives container restarts. We set passwords via environment variables pulling from `.env`. The NestJS and Next.js services are commented out — in local dev we run those directly with NX, and we'll uncomment them for the production Docker deployment on Day 10.

---

**Q: Why Alpine images instead of the standard ones?**

Alpine Linux images are dramatically smaller — `postgres:16-alpine` is around 240MB versus ~380MB for the standard image. Smaller images mean faster pulls in CI/CD, smaller attack surface (fewer pre-installed packages means fewer potential vulnerabilities), and faster container startup. For production services, Alpine is the better default.

---

**Q: What happened with the port conflicts during setup and how did you resolve it?**

The default ports (5432 for Postgres, 6379 for Redis) were already in use because there was an SSH tunnel forwarding those ports on the machine. We systematically scanned for free ports using `lsof`, found that 5434 and 6381 were available, and updated both the `docker-compose.yml` port mappings and the `DATABASE_URL` and `REDIS_URL` in `.env` to match. This is a common real-world situation — you always check what's running before starting new services and never assume default ports are free.

---

**Q: Why store passwords in environment variables rather than hardcoding them?**

This is a fundamental security practice — secrets should never live in your codebase. If you hardcode a database password and accidentally push it to a public GitHub repo, it's compromised immediately. Environment variables keep secrets out of source control. The `.env` file is in `.gitignore` so it's never committed. The `.env.example` file shows what variables are needed without actual values, so teammates know what to set up. In production, these variables come from your deployment platform (Kubernetes secrets, AWS Secrets Manager, etc.).

---

## 6. Prisma & Database Schema

---

**Q: Walk me through the decision to put the Prisma schema in `packages/database` rather than inside `apps/api`.**

The schema lives in a shared package because the Prisma-generated TypeScript types need to be available to both `apps/api` (NestJS) and `apps/web` (Next.js). If the schema lived inside `apps/api`, we'd have to either publish the types as an npm package or duplicate them — both bad. However — and this is critical — the `PrismaClient` instantiation does NOT live in the shared package. It lives only in `apps/api`'s `PrismaService`. The shared package exports types only. This preserves NestJS's dependency injection lifecycle and connection pool management.

---

**Q: Why does `packages/database/index.ts` only re-export types and not `PrismaClient`?**

`PrismaClient` manages a connection pool to Postgres. In a NestJS application, we want that connection pool managed by NestJS's dependency injection container in a `PrismaService`. If `PrismaClient` were exported from the shared package, Next.js could accidentally import and instantiate it, creating a second connection pool from the frontend server — wasting connections and making the app harder to reason about. By only exporting types, we make it architecturally impossible to misuse the client.

---

**Q: Why UUID as the primary key instead of auto-incrementing integers?**

First, UUIDs are not guessable — an integer ID of `7` tells an attacker that records 1-6 exist. A UUID reveals nothing. Second, UUIDs work across distributed systems — if you ever shard your database or generate IDs in multiple places, UUIDs won't collide. Third, they can be generated without a DB roundtrip. The downside is slightly larger storage (16 bytes vs 4), but for most SaaS apps this is irrelevant.

---

**Q: Explain the `onDelete: Cascade` on every relationship.**

`onDelete: Cascade` means when a parent record is deleted, all its children are automatically deleted. When a `User` is deleted, all their `RefreshToken`, `PasswordResetToken`, and `EmailVerificationToken` records are automatically cleaned up by the database. Without cascade, you'd have orphaned rows — tokens pointing to non-existent users — which would slowly accumulate and cause bugs.

---

**Q: What is a soft delete and why did you use it on User and Organization?**

A soft delete means we set a `deletedAt` timestamp instead of removing the row. The record stays in the database but the app treats it as deleted by filtering out rows where `deletedAt IS NOT NULL`. We use it on `User` and `Organization` because: you might need to restore a deleted account, you need audit trails for compliance, and you need to keep foreign key references intact. Soft deletes are the safer, more recoverable choice for user data.

---

**Q: Why do the token models store a `tokenHash` instead of the raw token?**

Same principle as password hashing. If your database is ever compromised, the attacker should not be able to use those tokens to log in as every user. By storing a hash of the token, the attacker gets useless strings. The real token is generated as a secure random value, sent to the client in a cookie, and then hashed before being stored. When the client sends it back, we hash it again and compare. The raw token never persists anywhere in the system except the client's cookie.

---

**Q: Explain the `@@unique([userId, organizationId])` on `OrgMember`.**

This is a composite unique constraint — it prevents a user from being a member of the same organization twice. Without it, a race condition in the invitation flow could insert two `OrgMember` rows with the same `userId` and `organizationId`. The database constraint is the last line of defence. It's always better to enforce data integrity at the database level rather than relying solely on application code.

---

**Q: Why did you add `@@index` on `OrgMember.userId` and `OrgMember.organizationId`?**

These are the two most common query patterns: "what orgs does this user belong to?" (queries by `userId`) and "who are the members of this org?" (queries by `organizationId`). Without indexes, each query does a full table scan. With indexes, Postgres can jump directly to matching rows in `O(log n)` time. As the table grows to tens of thousands of members, the difference between indexed and non-indexed goes from milliseconds to seconds.

---

**Q: Why is there a separate `Invitation` model instead of just adding an `isPending` flag to `OrgMember`?**

An invitation is fundamentally different from a membership. An invitation is for someone who may not be a user yet — their email address is all we have, no `userId`. We also need to track when it expires, what role they'll get when they accept, and we need a secure token for the invitation email link. An `OrgMember` row requires a `userId` (a foreign key to `User`), so it cannot represent a pending invitation to a non-user. Keeping them separate also keeps query logic clean.

---

**Q: Explain the `AuditLog` model and its indexes.**

Audit logging records every significant action (user registered, org created, member invited, plan changed) with who did it, when, in which org, and optional JSON metadata. This serves compliance, security investigation, and debugging. The `@@index([organizationId])` makes it fast to query "all actions in this org." The `@@index([createdAt])` makes it fast to query "all actions in the last 30 days." Without these, querying audit logs on large datasets would do full table scans.

---

## 7. Multi-Tenancy & RBAC

---

**Q: How does multi-tenancy work in your schema?**

Every piece of data that belongs to an organization is linked through `organizationId`. The `Organization` model is the tenant. Users don't directly own resources — they have `OrgMember` records that associate them with organizations and assign them a role. This is the "shared database, shared schema" multi-tenancy model — all tenants' data lives in the same tables, separated by `organizationId`. It's the most practical choice for a SaaS boilerplate at the scale most companies operate.

---

**Q: Explain the RBAC design.**

Three roles in the `OrgRole` enum: `OWNER`, `ADMIN`, and `MEMBER`. These live on `OrgMember`, which means a user's role is per-organization — they could be `OWNER` in one org and `MEMBER` in another. `MEMBER` can use the product, `ADMIN` can manage members and settings, `OWNER` has full control. In NestJS, an `OrgRolesGuard` reads the current user's `OrgMember.role` and compares it to what the endpoint requires via a `@OrgRoles(OrgRole.ADMIN)` decorator.

---

**Q: Why is a user automatically made OWNER when they create an organization?**

When someone creates an org, they should have full control over it immediately. Making them OWNER prevents the edge case of an org with no owner. The service layer handles this atomically: create the org and create the `OrgMember` record with `role: OWNER` in the same database transaction, so there's never a moment where the org exists without an owner.

---

## 8. Security Design

---

**Q: Why argon2 for password hashing instead of bcrypt?**

argon2 won the Password Hashing Competition in 2015 and is the gold standard today. The key advantage is that argon2 is memory-hard — it requires a large amount of RAM to compute, making it very expensive to run on GPUs or ASICs that attackers use for cracking. bcrypt uses only CPU, so attackers can build cheap GPU clusters to crack it at scale. We use `argon2id` which combines resistance to side-channel attacks and GPU cracking.

---

**Q: Why JWT in httpOnly cookies instead of localStorage?**

localStorage is accessible by any JavaScript on the page. If your app has even a small XSS vulnerability, an attacker can read everything in localStorage. An `httpOnly` cookie is completely inaccessible to JavaScript — only the browser itself can read it and it's automatically sent with every request. The `Secure` flag ensures it only goes over HTTPS. The `SameSite=Strict` flag prevents it from being sent in cross-site requests, mitigating CSRF. Together these make JWT theft significantly harder.

---

**Q: What is refresh token rotation and why is it important?**

When a user logs in, they get a short-lived access token (15 minutes) and a long-lived refresh token (7 days). Every time the access token expires, the client uses the refresh token to get a new one. With rotation, every use of the refresh token also issues a new refresh token and invalidates the old one — each token can only be used once. If an attacker steals a refresh token and tries to use it after the legitimate client already used it, the system detects the reuse (both tokens exist but only one should be valid) and can invalidate the entire session. Without rotation, a stolen refresh token is valid for a full 7 days.

---

**Q: What is `proxy.ts` and how does it protect routes?**

`proxy.ts` is a server-side utility function called at the top of `(app)/layout.tsx`. Since every protected page renders through this layout first, this single call gates the entire authenticated section. It reads the JWT from the httpOnly cookie, validates it, and calls `redirect('/login')` if invalid. We named it `proxy.ts` rather than using Next.js's `middleware.ts` because it runs in the full Node.js runtime (not the Edge Runtime), giving us access to all Node.js APIs and packages for complex token validation and refresh logic.

---

## 9. Billing & Subscriptions

---

**Q: How does the Subscription model connect to billing?**

`Subscription` stores our internal representation of subscription state — `planId` (e.g., "free", "pro"), `status` (ACTIVE, CANCELED, etc.), and the Stripe subscription ID. When Stripe sends a webhook (e.g., `invoice.paid`), we look up the subscription by `stripeSubscriptionId` and update the status and `currentPeriodEnd`. The `Organization` stores `stripeCustomerId` so we can create billing portal sessions without calling Stripe to look up the customer each time.

---

**Q: Why is `organizationId` unique on the `Subscription` model?**

An organization should have exactly one subscription. The `@unique` constraint makes this a hard database guarantee — it's impossible to accidentally create two subscriptions for the same org. Without this, a race condition in the Stripe webhook handler could create duplicate subscriptions resulting in very confusing billing data.

---

**Q: How does feature gating work?**

On the backend, a `PlanGuard` in NestJS decorated with `@RequirePlan('pro')` reads the current org's `Subscription.planId` and throws `403 Forbidden` if it doesn't meet the required plan. On the frontend, a `<PlanGate plan="pro">` component reads the plan from context and either renders its children or shows an upgrade nudge. The two layers together ensure that even if someone bypasses the UI, the API still enforces the restriction.

---

## 10. Sprint Planning & Git

---

**Q: How did you structure the 10-day sprint?**

Each day is self-contained and shippable — one PR, one feature area, one clear deliverable. The ordering follows dependency logic: infrastructure first (Day 1), then both apps bootstrapped (Day 2), backend auth (Day 3), frontend auth (Day 4), and so on. The hardest days (3, 5, 6, 9) are spread out so you're never hitting two brutal days back-to-back.

---

**Q: Why one branch per day instead of feature branches?**

One branch per day creates a hard forcing function: whatever is on that branch at end-of-day gets committed and merged. It also creates a clean, reviewable history — looking at the PRs tells the story of how the project was built. Feature branches are better for team collaboration, but for a tight solo sprint they introduce too much "in progress" state.

---

**Q: Explain Conventional Commits and why you use this format.**

Conventional Commits standardizes the format: `type(scope): message`. Common types: `feat` (new feature), `fix` (bug fix), `chore` (maintenance), `docs` (documentation). The benefits: you can auto-generate changelogs, semantic versioning can be automated, and reading the git log immediately tells you what each commit did without diffing the code. It also communicates intent to code reviewers.

---

**Q: What was verified in the database at the end of Day 1?**

We ran `psql` directly against the Docker container and listed all tables (`\dt`). The output showed all 9 expected tables: `User`, `RefreshToken`, `PasswordResetToken`, `EmailVerificationToken`, `Organization`, `OrgMember`, `Invitation`, `Subscription`, `AuditLog`, plus the `_prisma_migrations` tracking table. Each table had `saas_user` as the owner, confirming the `DATABASE_URL` credentials were correct. The migration file `20260712201750_init/migration.sql` is committed to git so any developer can recreate the exact same schema from scratch.

---

**Q: What files make up the monorepo root and what does each one do?**

- `package.json` — defines the workspace glob patterns and root-level scripts like `npm run dev`
- `nx.json` — the NX task pipeline: caching rules, target defaults, plugin registration
- `docker-compose.yml` — runs Postgres and Redis locally in isolated Docker containers
- `.env.example` — the template showing every environment variable the project needs (no real values)
- `.gitignore` — tells git what to ignore: node_modules, .env, build outputs, NX cache, uploads
- `README.md` — project overview (expanded later)

---

*More Q&A will be added at the end of each day as we build more features.*
