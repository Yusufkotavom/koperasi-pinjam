// ============================================================================
// Pembulatan cicilan ke ribuan bulat (Skenario 2)
// ----------------------------------------------------------------------------
// Aturan:
//  - Pokok per cicilan (1..tenor-1) dibulatkan KE ATAS ke ribuan.
//    Cicilan TERAKHIR menampung seluruh sisa sehingga Σ pokok = plafon TEPAT.
//    (konsekuensi: cicilan terakhir lebih kecil — "skenario 2")
//  - Bunga flat per cicilan dibulatkan ke ribuan terdekat (tetap sama tiap bulan).
//  - Total tiap cicilan = pokok + bunga → dijamin bulat ribuan.
//
// Jaminan "tidak miss":
//  - Σ pokok  = plafon                                  (pokok pasti tertutup)
//  - Σ bunga  = bungaFlat × tenor
//  - Grand total = plafon + (bungaFlat × tenor)
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
  /** Pokok cicilan terakhir (biasanya lebih kecil dari cicilan lain). */
  angsuranPokokTerakhir: number
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
 * @param bungaPerBulan Bunga flat per bulan sebagai desimal (0.015 = 1,5%).
 */
export function buildRencanaAngsuran(
  plafon: number,
  tenor: number,
  bungaPerBulan: number,
): RencanaAngsuran {
  const n = Math.max(1, Math.floor(tenor))
  const nominal = Math.round(plafon)
  const bungaFlat = Math.max(0, roundRibuan(nominal * bungaPerBulan))

  // Pokok dasar: bulat ke atas ke ribuan (skenario 2).
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
  const total: number[] = pokok.map((p, i) => p + bunga[i])

  const lastIdx = n - 1
  return {
    pokok,
    bunga,
    total,
    angsuranPokok: pokok[0],
    angsuranBunga: bungaFlat,
    totalAngsuran: total[0],
    angsuranPokokTerakhir: pokok[lastIdx],
    totalTerakhir: total[lastIdx],
    totalPokok: nominal,
    totalBunga: bungaFlat * n,
    totalBayar: nominal + bungaFlat * n,
  }
}
