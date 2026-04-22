# Update Ranking Indicators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the ranking indicator system to distinguish between "Outstanding Debt" and "Arrears" (Tunggakan), ensuring new customers start with a clean Rank A even if they have large loans.

**Architecture:**
- Update `RankingConfig` to use `tunggakanNominal` instead of `kurangAngsuran`.
- Standardize the calculation logic across `src/actions/nasabah.ts`, `src/actions/pembayaran.ts`, and `src/app/(dashboard)/nasabah/[id]/page.tsx`.
- Update the UI to show explicit labels: Telat, Belum JT, Tunggakan, Outstanding, and Anomali.

**Tech Stack:** Next.js (Server Actions), Prisma, Tailwind CSS, Zod.

---

### Task 1: Update Ranking Utility & Configuration

**Files:**
- Modify: `src/lib/ranking.ts`
- Modify: `src/actions/settings.ts`
- Modify: `src/app/(dashboard)/settings/ranking-settings-form.tsx`

- [ ] **Step 1: Update `src/lib/ranking.ts`**
  Rename `kurangAngsuran` to `tunggakanNominal` in types and functions. Update `explainRanking` summary text.

- [ ] **Step 2: Update `src/actions/settings.ts`**
  Update the Zod schema and `updateRankingConfig` to reflect the name change if necessary (keep DB key same for compatibility but update code labels).

- [ ] **Step 3: Update `src/app/(dashboard)/settings/ranking-settings-form.tsx`**
  Update labels from "Kurang Angsuran" to "Tunggakan Nominal".

### Task 2: Standardize Indicator Calculation in Actions

**Files:**
- Modify: `src/actions/nasabah.ts`
- Modify: `src/actions/pembayaran.ts`

- [ ] **Step 1: Fix `src/actions/nasabah.ts` calculation**
  Ensure `totalTagihan` and `totalDibayar` for ranking only include installments that are past due or already paid.

```typescript
// Inside loop for nasabah
for (const jadwal of pinjaman.jadwalAngsuran) {
  const nominalTagihan = Number(jadwal.total)
  const bayarParsial = pembayaranTagMap.get(jadwal.id) ?? 0
  const bayarEfektif = jadwal.sudahDibayar ? nominalTagihan : Math.min(nominalTagihan, bayarParsial)

  // Arrears (Tunggakan) Calculation: Only past due or paid
  if (jadwal.sudahDibayar || jadwal.tanggalJatuhTempo <= now || bayarEfektif > 0) {
    totalTagihanArrears += nominalTagihan
    totalDibayarArrears += bayarEfektif
  }
  
  // Outstanding and Future info
  if (jadwal.tanggalJatuhTempo > now && !jadwal.sudahDibayar) {
    belumJatuhTempo += 1
  }
  // ... rest of logic
}
const tunggakanNominal = Math.max(0, totalTagihanArrears - totalDibayarArrears)
const ranking = computeRanking({ telat, tunggakanNominal }, rankingConfig)
```

- [ ] **Step 2: Update `src/actions/pembayaran.ts` (Reports)**
  Apply the same logic to `getHistoryPembayaranNasabahReport` and `getLaporanTransaksiUserReport`.

### Task 3: Update UI Indicators and Tooltips

**Files:**
- Modify: `src/app/(dashboard)/nasabah/[id]/page.tsx`
- Modify: `src/app/(dashboard)/laporan/transaksi-per-user/page.tsx`
- Modify: `src/app/(dashboard)/nasabah/page.tsx`

- [ ] **Step 1: Update Nasabah Detail Page**
  Rename "Kurang" to "Tunggakan" and ensure "Outstanding" (Principal) is shown correctly. Add "Belum JT" to the indicators list.

- [ ] **Step 2: Update Report Table Headers**
  Change "Kurang" to "Tunggakan" in `getLaporanTransaksiUserReport` table.

- [ ] **Step 3: Add Anomali Indicator**
  Ensure "Anomali Pencatatan" (payment without schedule tag) is visible in the indicators summary.

### Task 4: Verification

- [ ] **Step 1: Verify new loan ranking**
  Create/find a nasabah with a fresh large loan and 0 late payments. Confirm they are Rank A.

- [ ] **Step 2: Verify arrears ranking**
  Simulate 1 late payment with amount > limit. Confirm Rank B/C/D based on config.
