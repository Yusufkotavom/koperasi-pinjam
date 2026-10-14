// ============================================================================
// Pembulatan cicilan ke ribuan bulat (Skenario 2 — pokok & BUNGA)
// ----------------------------------------------------------------------------
// Aturan:
//  - Pokok per cicilan (1..tenor-1) dibulatkan KE ATAS ke ribuan.
//    Cicilan TERAKHIR menampung seluruh sisa sehingga Σ pokok = plafon TEPAT.
//    (konsekuensi: cicilan terakhir lebih kecil dari yang lain)
//  - Bunga flat per cicilan (1..tenor-1) dibulatkan ke ribuan TERDEKAT.
//    Cicilan TERAKHIR menampung sisa bunga sehingga Σ bunga = bunga total TEPAT.
//    (konsekuensi: bunga cicilan terakhir bisa lebih besar/kecil dari yang lain)
//  - Total tiap cicilan = pokok + bunga → dijamin bulat ribuan.
//
// Jaminan "tidak miss":
//  - Σ pokok  = plafon                                      (pokok pasti tertutup)
//  - Σ bunga  = round(plafon × bungaPerPeriode × tenor)     (bunga total tepat)
//  - Grand total = plafon + Σ bunga
//
// Catatan: skenario bunga ini mencegah "kebocoran" residu pembulatan yang
//  dulu membuang (mis. 9.375 → 9.000 tiap periode; 8×375 = 3.000 hilang).
// ============================================================================

export type RencanaAngsuran = {
  /** Pokok per cicilan (index 0 = cicilan ke-1). Panjang = tenor. */
  pokok: number[]
  /** Bunga per cicilan (index 0 = cicilan ke-1). Panjang = tenor. */
  bunga: number[]
  /** Total tagihan per cicilan (pokok + bunga). Panjang = tenor. */
  total: number[]
  /** Nilai representatif cicilan ke-1 (dipakai utk kolom Pinjaman). */
  angsuranPokok: number
  angsuranBunga: number
  totalAngsuran: number
  /** Pokok cicilan terakhir (pokoknya bisa lebih kecil; bunga bisa menampung sisa). */
  angsuranPokokTerakhir: number
  angsuranBungaTerakhir: number
  totalTerakhir: number
  /** Agregat. */
  totalPokok: number
  totalBunga: number
  totalBayar: number
}

/** Bulatkan ke ribuan ke atas (ceil). */
function ceilRibuan(n: number): number {
  return Math.ceil(n / 1000) * 1000
}

/** Bulatkan ke ribuan terdekat (round). */
function roundRibuan(n: number): number {
  return Math.round(n / 1000) * 1000
}

/**
 * Bangun rencana angsuran terbulat.
 * @param plafon        Pokok pinjaman (nominal penuh).
 * @param tenor         Jumlah cicilan.
 * @param bungaPerBulan Bunga flat PER PERIODE sebagai desimal (0.015 = 1,5%).
 *                      Tenor MINGGUAN → rate per minggu; BULANAN → per bulan.
 */
export function buildRencanaAngsuran(
  plafon: number,
  tenor: number,
  bungaPerBulan: number,
): RencanaAngsuran {
  const n = Math.max(1, Math.floor(tenor))
  const nominal = Math.round(plafon)
  const rate = Math.max(0, bungaPerBulan)

  // ---- Bunga (skenario 2: flat ke ribuan terdekat + sisa di cicilan terakhir)
  let bungaFlat = roundRibuan(nominal * rate)
  const bungaTotalTarget = roundRibuan(nominal * rate * n)
  // Guard: bila pembulatan per-periode membuat Σ(1..n-1) melebihi target,
  // turunkan nilai flat agar cicilan terakhir tetap tak-negatif.
  while (bungaFlat > 0 && bungaFlat * (n - 1) > bungaTotalTarget) {
    bungaFlat -= 1000
  }
  if (bungaFlat < 0) bungaFlat = 0

  // ---- Pokok (skenario 2: ceil ke ribuan + sisa di cicilan terakhir)
  let base = ceilRibuan(nominal / n)
  // Guard untuk plafon/tenor yang tidak realistis (base terlalu besar → sisa negatif).
  if (base > 0 && base * (n - 1) >= nominal) {
    base = Math.floor(nominal / n / 1000) * 1000
  }
  if (base < 0) base = 0

  const pokok: number[] = []
  for (let i = 0; i < n - 1; i++) pokok.push(base)
  const sisaPokok = nominal - base * (n - 1)
  pokok.push(sisaPokok)

  const bunga: number[] = Array.from({ length: n }, () => bungaFlat)
  const sisaBunga = bungaTotalTarget - bungaFlat * (n - 1)
  bunga[n - 1] = sisaBunga < 0 ? 0 : sisaBunga

  const total: number[] = pokok.map((p, i) => p + bunga[i])

  const lastIdx = n - 1
  const totalBunga = bunga.reduce((a, b) => a + b, 0)
  return {
    pokok,
    bunga,
    total,
    angsuranPokok: pokok[0],
    angsuranBunga: bunga[0],
    totalAngsuran: total[0],
    angsuranPokokTerakhir: pokok[lastIdx],
    angsuranBungaTerakhir: bunga[lastIdx],
    totalTerakhir: total[lastIdx],
    totalPokok: nominal,
    totalBunga,
    totalBayar: nominal + totalBunga,
  }
}

/**
 * Label satuan periode mengikuti tipe tenor.
 * Dipakai untuk menghindari label "per bulan" yang salah pada pinjaman mingguan.
 */
export function periodeLabel(tenorType?: string | null): {
  unit: string
  Unit: string
  per: string
  perCap: string
} {
  if (tenorType === "MINGGUAN") {
    return { unit: "minggu", Unit: "Minggu", per: "/minggu", perCap: "per Minggu" }
  }
  return { unit: "bulan", Unit: "Bulan", per: "/bulan", perCap: "per Bulan" }
}
