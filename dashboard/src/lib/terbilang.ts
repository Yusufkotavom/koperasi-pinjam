const SATUAN = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
]

function bilang(n: number): string {
  n = Math.floor(Math.abs(n))
  if (n < 12) return SATUAN[n]
  if (n < 20) return `${bilang(n - 10)} Belas`
  if (n < 100) return `${bilang(Math.floor(n / 10))} Puluh ${bilang(n % 10)}`.trim()
  if (n < 200) return `Seratus ${bilang(n - 100)}`.trim()
  if (n < 1000) return `${bilang(Math.floor(n / 100))} Ratus ${bilang(n % 100)}`.trim()
  if (n < 2000) return `Seribu ${bilang(n - 1000)}`.trim()
  if (n < 1000000) return `${bilang(Math.floor(n / 1000))} Ribu ${bilang(n % 1000)}`.trim()
  if (n < 1000000000) return `${bilang(Math.floor(n / 1000000))} Juta ${bilang(n % 1000000)}`.trim()
  if (n < 1000000000000) return `${bilang(Math.floor(n / 1000000000))} Miliar ${bilang(n % 1000000000)}`.trim()
  if (n < 1000000000000000) return `${bilang(Math.floor(n / 1000000000000))} Triliun ${bilang(n % 1000000000000)}`.trim()
  return `${n}`
}

export function terbilang(n: number | string | bigint | null | undefined): string {
  if (n === null || n === undefined) return "Nol Rupiah"
  const num = typeof n === "bigint" ? Number(n) : typeof n === "string" ? Number(n) : n
  if (!Number.isFinite(num) || num === 0) return "Nol Rupiah"
  const teks = bilang(num)
  return `${teks} Rupiah`
}
