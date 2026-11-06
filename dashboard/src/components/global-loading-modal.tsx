"use client"

import { useGlobalLoader } from "@/lib/use-global-loader"
import { Loader2 } from "lucide-react"

export function GlobalLoadingModal() {
  const { isLoading, title, description } = useGlobalLoader()

  if (!isLoading) return null

  return (
    <div
      aria-live="assertive"
      role="alertdialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200"
    >
      <div className="relative mx-4 flex w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-border/80 bg-background/95 p-6 text-center shadow-2xl backdrop-blur-md dark:border-slate-800">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>

        <h3 className="text-base font-bold text-foreground">
          {title}
        </h3>

        {description && (
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}

        <div className="mt-5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-1.5 w-full animate-pulse bg-primary rounded-full" />
        </div>
      </div>
    </div>
  )
}
