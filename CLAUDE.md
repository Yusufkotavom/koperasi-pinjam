# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a cooperative lending management system (Koperasi Pinjam) built with Next.js. The main application is in the `dashboard/` directory.

**Key directories:**
- `dashboard/src/app/` - Next.js App Router routes (auth, dashboard, platform)
- `dashboard/src/actions/` - Server actions for business logic
- `dashboard/src/lib/` - Core utilities (auth, tenant, accounting, prisma)
- `dashboard/prisma/` - Database schema and migrations
- `dashboard/src/components/` - Reusable UI components

## Development Commands

**Setup:**
```bash
cd dashboard
npm install
npm run db:generate
npm run db:push
npm run db:seed  # optional
```

**Development:**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run db:studio    # Open Prisma Studio
```

**Database:**
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB (non-migration)
npm run db:migrate   # Create and run migration
npm run db:seed      # Seed database with default data
```

## Technology Stack

- **Framework:** Next.js 16.2.4 (App Router, Turbopack)
- **Runtime:** React 19.2.4
- **Database:** PostgreSQL with Prisma 7.7.0 ORM
- **Auth:** NextAuth v5 beta (Credentials provider)
- **UI:** shadcn/ui + Tailwind CSS
- **State:** Zustand for client state

## Critical Architecture Concepts

### Multi-Tenant System
Every user belongs to a Company. All business operations must be scoped by `companyId`:

- Use `requireCompanyId()` from `src/lib/tenant.ts` in server actions
- All queries must filter by `companyId` except for `SUPER_ADMIN` operations
- Users are rejected at login if their company is inactive

### Authentication & Authorization
- **Login validation:** User must be active AND company must be active
- **Role-based access:** Middleware in `middleware.ts` guards routes by role
- **Platform access:** `/platform` routes restricted to `SUPER_ADMIN` only
- **Tenant isolation:** Non-super-admin users can only access their company data

### Accounting System
The system includes double-entry bookkeeping:

- **Accounts:** Chart of accounts per company (`Account` model)
- **Journals:** All transactions create journal entries (`JournalEntry`, `JournalLine`)
- **Cash tracking:** Cash balances calculated from journal lines for cash accounts
- **Modes:** `SIMPLE` or `PROPER` accounting mode per company
- **Idempotency:** Journal posting is idempotent via `(sourceType, sourceId)` unique constraint

### Critical Business Flows

**Loan Disbursement (`src/actions/pengajuan.ts`):**
- Validates cash balance before disbursement
- Uses end-of-day timestamp for balance calculation
- Creates journal entries for accounting
- Common error: "Insufficient cash balance" due to unapproved transactions

**Cash Management (`src/actions/kas.ts`):**
- Non-privileged users create pending transactions requiring approval
- Privileged roles auto-approve and post journals immediately
- Cash withdrawals validate balance before saving

**Payment Processing (`src/actions/pembayaran.ts`):**
- Records loan payments and creates journal entries
- Handles principal, interest, and fee allocations
- Updates loan schedules and balances

## Database Schema Key Points

**Multi-tenant constraints:**
- Most operational tables have `companyId` for tenant isolation
- Unique constraints often include `companyId` (e.g., `[companyId, nik]` for customers)

**Critical models:**
- `Company` - Tenant root with status controls
- `User` + `UserRole` - Authentication and authorization
- `Nasabah` - Customers with unique NIK per company
- `Pengajuan` → `Pinjaman` - Loan application to active loan flow
- `JadwalAngsuran` + `Pembayaran` - Payment schedules and records
- `Account` + `JournalEntry` + `JournalLine` - Accounting system

## Development Guidelines

### Before Making Changes
1. Read Next.js docs in `node_modules/next/dist/docs/` for API changes
2. Understand tenant scoping requirements
3. Check existing patterns in similar actions/components

### Testing Changes
1. Run `npm run build` to verify compilation
2. If schema changes: `npm run db:generate`
3. Test multi-tenant isolation
4. Verify accounting journal balance

### Common Pitfalls
- **Tenant leakage:** Forgetting `companyId` filters in queries
- **Cash balance errors:** Unapproved transactions or wrong cash type selection
- **Hydration mismatches:** Non-deterministic server/client rendering
- **Wrong directory:** Commands must run from `dashboard/` directory

### Security Considerations
- All business queries must include tenant scoping
- Validate user permissions before data access
- Super admin operations require explicit role checks
- Sensitive operations (disbursement, cash) have additional validations

## Environment Setup

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth JWT secret
- `DIRECT_URL` - Direct DB connection for migrations (optional)

## Next.js Version Notice

This project uses Next.js 16.2.4 with breaking changes from earlier versions. Always check local documentation in `node_modules/next/dist/docs/` before using APIs that may have changed.