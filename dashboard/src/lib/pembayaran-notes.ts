export type ParsedPembayaranCatatan = {
  jadwalIds: string[]
  mode?: "FULL" | "PARSIAL" | "PELUNASAN"
  userNote?: string
}

const MODE_LABELS: Record<NonNullable<ParsedPembayaranCatatan["mode"]>, string> = {
  FULL: "Pembayaran penuh",
  PARSIAL: "Pembayaran parsial",
  PELUNASAN: "Pelunasan",
}

export function parsePembayaranCatatan(catatan?: string | null): ParsedPembayaranCatatan {
  const source = catatan?.trim() ?? ""
  if (!source) return { jadwalIds: [] }

  const jadwalIds = Array.from(source.matchAll(/\[JADWAL:([^\]]+)\]/g)).map((match) => match[1])
  const modeMatch = source.match(/\bmode=(FULL|PARSIAL|PELUNASAN)\b/)
  const mode = modeMatch?.[1] as ParsedPembayaranCatatan["mode"] | undefined
  const userNote = source
    .replace(/\[JADWAL:[^\]]+\]/g, "")
    .replace(/\bmode=(FULL|PARSIAL|PELUNASAN)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()

  return {
    jadwalIds,
    mode,
    userNote: userNote || undefined,
  }
}

export function formatPembayaranModeLabel(mode?: ParsedPembayaranCatatan["mode"]) {
  return mode ? MODE_LABELS[mode] : undefined
}
