"use client"

import { useEffect, useState } from "react"
import { Bell, CalendarDays, Clock3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type DashboardHeaderProps = {
  title: string
  description: string
  dateLabel: string
  initialTimeLabel: string
  notificationCount: number
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

export function DashboardHeader({
  title,
  description,
  dateLabel,
  initialTimeLabel,
  notificationCount,
}: DashboardHeaderProps) {
  const [timeLabel, setTimeLabel] = useState(initialTimeLabel)

  useEffect(() => {
    const updateClock = () => setTimeLabel(formatClock(new Date()))
    updateClock()
    const timer = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.85)]">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]" />
            Header cepat dashboard
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">{description}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[26rem]">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              <CalendarDays className="size-3.5" />
              Tanggal
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{dateLabel}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              <Clock3 className="size-3.5" />
              Jam
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{timeLabel}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-amber-200">
              <Bell className="size-3.5" />
              Notif
            </div>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-sm font-semibold text-white">
                {notificationCount > 0 ? `${notificationCount} penagihan` : "Tidak ada notif"}
              </p>
              {notificationCount > 0 ? (
                <Badge className={cn("border-0 bg-amber-300/15 text-amber-100 hover:bg-amber-300/15")}>
                  Hari ini
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-amber-100/80">
              {notificationCount > 0
                ? "Cek jadwal kolektor dan follow up angsuran jatuh tempo."
                : "Semua jadwal penagihan hari ini aman."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
