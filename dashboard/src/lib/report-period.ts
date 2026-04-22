export type ReportPeriodMode = "MONTH" | "WEEK" | "CUSTOM"

export type ReportPeriodInput = {
  periodMode?: string
  month?: string
  year?: string
  week?: string
  from?: string
  to?: string
}

export type ReportPeriod = {
  mode: ReportPeriodMode
  month: number
  year: number
  week: number
  startDate: Date
  endDate: Date
  fromInput: string
  toInput: string
  label: string
}

const DAY_MS = 24 * 60 * 60 * 1000

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDateInput(value: string | undefined, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function startOfISOWeek(date: Date) {
  const result = new Date(date)
  const day = (result.getDay() + 6) % 7
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - day)
  return result
}

function formatDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function resolveReportPeriod(input?: ReportPeriodInput): ReportPeriod {
  const now = new Date()
  const requestedMode = input?.periodMode
  const mode: ReportPeriodMode =
    requestedMode === "WEEK" || requestedMode === "CUSTOM" ? requestedMode : "MONTH"
  const month = Math.min(Math.max(Number(input?.month ?? now.getMonth() + 1), 1), 12)
  const year = Number(input?.year ?? now.getFullYear())
  const week = Math.min(Math.max(Number(input?.week ?? 1), 1), 53)

  let startDate: Date
  let endDate: Date

  if (mode === "CUSTOM") {
    const fallbackStart = new Date(year, month - 1, 1)
    const fallbackEnd = new Date(year, month, 0)
    startDate = parseDateInput(input?.from, fallbackStart)
    endDate = parseDateInput(input?.to, fallbackEnd)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    endDate = new Date(endDate.getTime() + DAY_MS)
  } else if (mode === "WEEK") {
    const firstWeekStart = startOfISOWeek(new Date(year, 0, 4))
    startDate = new Date(firstWeekStart.getTime() + (week - 1) * 7 * DAY_MS)
    endDate = new Date(startDate.getTime() + 7 * DAY_MS)
  } else {
    startDate = new Date(year, month - 1, 1)
    endDate = new Date(year, month, 1)
  }

  if (endDate <= startDate) {
    endDate = new Date(startDate.getTime() + DAY_MS)
  }

  const inclusiveEnd = new Date(endDate.getTime() - DAY_MS)

  return {
    mode,
    month,
    year,
    week,
    startDate,
    endDate,
    fromInput: toDateInput(startDate),
    toInput: toDateInput(inclusiveEnd),
    label:
      mode === "MONTH"
        ? new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })
        : `${formatDate(startDate)} - ${formatDate(inclusiveEnd)}`,
  }
}
