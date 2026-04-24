import { differenceInDays } from "date-fns"
import type { DendaConfig } from "@/actions/settings"

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function hitungDenda(sisaPinjaman: number, tanggalJatuhTempo: Date, tanggalBayar: Date, dendaConfig: DendaConfig) {
  const hariTelat = differenceInDays(startOfDay(tanggalBayar), startOfDay(tanggalJatuhTempo))
  if (hariTelat <= 0) return 0
  
  if (dendaConfig.amount === 0) return 0

  if (dendaConfig.type === "NOMINAL") {
    return Math.round(dendaConfig.amount * hariTelat)
  }

  // PERCENTAGE type (amount is e.g. 0.1 for 0.1%)
  const rate = dendaConfig.amount / 100 // convert 0.1% to 0.001
  return Math.round(sisaPinjaman * rate * hariTelat)
}
