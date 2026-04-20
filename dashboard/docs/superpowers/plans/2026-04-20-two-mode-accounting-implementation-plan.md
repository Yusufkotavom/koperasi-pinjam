# Two-Mode Accounting Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a company-setting switch that turns the accounting experience between Simple and Proper modes, with admin-only control, reload-based activation, and shared access to simple reports in both modes.

**Architecture:** Store the active accounting mode as an app setting in the existing `app_settings` table, expose it in Company Settings, and make the sidebar/pages read that mode to decide which accounting features to show. Keep the underlying transaction data unchanged so switching modes only changes presentation and available workflows, not historical records.

**Tech Stack:** Next.js App Router, Server Actions, Prisma, existing `app_settings` JSON storage, shadcn/ui, server-side auth/roles.

---

## Task 1: Add accounting mode primitives and persistence helpers

**Objective:** Create a single source of truth for the accounting mode value and read/write helpers with a safe default of `SIMPLE`.

**Files:**
- Create: `src/lib/accounting-mode.ts`
- Modify: `src/actions/settings.ts`
- Modify: `prisma/schema.prisma` only if a database enum/column is needed later; prefer existing `app_settings` JSON for now.

**Implementation notes:**
- Define an `AccountingMode` type with two values: `SIMPLE` and `PROPER`.
- Add normalization so missing/invalid values fall back to `SIMPLE`.
- Store the mode under a dedicated app setting key, for example `ACCOUNTING_MODE`.
- Add `getAccountingMode()` and `updateAccountingMode()` server actions.
- `updateAccountingMode()` must enforce **Admin-only** access.
- Keep `getCompanyInfo()` and `updateCompanyInfo()` behavior unchanged for non-mode fields.

**Verification:**
- Reading mode with no setting present returns `SIMPLE`.
- Writing `PROPER` persists successfully.
- Non-admin role receives a permission error on update.

---

## Task 2: Add the mode switch to Company Settings

**Objective:** Let an admin switch the accounting mode directly from the existing Settings page.

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`
- Modify: `src/app/(dashboard)/settings/company-settings-form.tsx`
- Optionally create: `src/app/(dashboard)/settings/accounting-mode-card.tsx` if the form gets too crowded.

**Implementation notes:**
- Show a single toggle or segmented control labeled `Mode Akuntansi`.
- Reflect current mode as `Simple` or `Proper`.
- Add helper text explaining:
  - Simple is default and lightweight
  - Proper adds full accounting capabilities
  - switching requires reload to take effect
- Hide or disable the control for non-admin users.
- Save mode via the new server action, then instruct the user to reload.
- Keep the rest of Company Settings usable as before.

**Verification:**
- Admin can switch between modes from `/settings`.
- Non-admin users can view settings but cannot change mode.
- Success toast appears after save and text mentions reload.

---

## Task 3: Make navigation mode-aware

**Objective:** Show only the correct accounting entries in the sidebar for the active mode while preserving simple reports in both modes.

**Files:**
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

**Implementation notes:**
- Pass the current accounting mode into the sidebar from the dashboard layout.
- In `Simple` mode, show the simple accounting/reporting entries that already exist today.
- In `Proper` mode, continue to show the simple reports, but add the proper accounting entries such as COA, journal, ledger, trial balance, reconciliation, and audit trail.
- Keep the sidebar structure clean so the user sees one coherent accounting section rather than duplicated menu items.
- Prefer hiding inaccessible routes rather than cluttering the menu with disabled items.

**Verification:**
- Sidebar differs between `Simple` and `Proper` modes.
- Simple reports remain visible in both modes.
- New proper-only items appear only when mode is `PROPER`.

---

## Task 4: Gate accounting pages by mode

**Objective:** Prevent users from landing on proper-only pages when the system is in Simple mode, without breaking direct access to simple reports.

**Files:**
- Modify the relevant accounting and report pages under:
  - `src/app/(dashboard)/akuntansi/**`
  - `src/app/(dashboard)/laporan/**`
- Optionally create: `src/lib/accounting-guards.ts` for reusable mode checks.

**Implementation notes:**
- Add a reusable guard/helper such as `requireAccountingMode()` or `isProperMode()`.
- Simple reports (`arus-kas`, `laba-rugi`, `neraca`) must remain accessible in both modes.
- Proper-only pages should either:
  - redirect to a safe page, or
  - show a friendly “Mode Proper belum aktif” state.
- Keep the UX simple: if a route cannot function in Simple mode, explain why instead of throwing a raw error.

**Verification:**
- Simple mode blocks proper-only accounting pages.
- Proper mode allows all accounting pages.
- Simple report pages still render in both modes.

---

## Task 5: Refresh behavior and consistency cleanup

**Objective:** Make sure mode changes are reflected only after reload and do not create inconsistent cached views.

**Files:**
- Modify: `src/actions/settings.ts`
- Modify: `src/app/(dashboard)/settings/page.tsx`
- Review: any pages that read the mode during server render.

**Implementation notes:**
- After update, revalidate settings-related paths as needed.
- Show a message telling the admin to reload for the change to fully apply.
- Make sure the default `SIMPLE` path works on fresh installs with no existing setting row.
- Avoid data migration logic entirely.

**Verification:**
- Changing the mode then reloading updates nav and page access.
- Fresh database with no `ACCOUNTING_MODE` row starts in `SIMPLE`.
- No historical transaction data is modified.

---

## Task 6: Test and verify end-to-end

**Objective:** Prove the switch works in both modes without breaking existing accounting reports.

**Files:**
- Add or update tests if the project already has a pattern for them.
- Otherwise verify manually with build and runtime checks.

**Verification commands:**
- `npm run build`
- Any targeted lint/test command already used in this repo for touched files
- Manual smoke test:
  - open `/settings`
  - switch mode as admin
  - reload the app
  - confirm sidebar and accounting pages change appropriately

**Acceptance checklist:**
- [ ] Default mode is `SIMPLE`
- [ ] Admin-only toggle exists in Company Settings
- [ ] Mode change requires reload to take effect
- [ ] Simple reports stay visible in Proper mode
- [ ] Proper-only pages are gated in Simple mode
- [ ] No data migration is introduced

---

## Implementation order
1. Add the accounting mode helper + server actions.
2. Add the toggle to Settings.
3. Make the sidebar mode-aware.
4. Gate pages by mode.
5. Verify with build and smoke tests.

## Notes
- Prefer keeping the mode in `app_settings` so the feature stays aligned with existing settings storage.
- If the Settings page becomes crowded, split the mode control into its own card component without changing the data flow.
- Keep the code path for Simple reports stable; Proper should extend the experience, not replace it.
