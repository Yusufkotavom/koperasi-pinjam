"use client"

import * as React from "react"
import { addTransitionType, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type NavigationIndicatorContextValue = {
  isNavigating: boolean
  startNavigation: (label?: string) => void
}

const NavigationIndicatorContext =
  React.createContext<NavigationIndicatorContextValue | null>(null)

export function NavigationIndicatorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [navigationFromPath, setNavigationFromPath] = React.useState<string | null>(
    null,
  )
  const timeoutRef = React.useRef<number | null>(null)

  const isNavigating =
    navigationFromPath !== null && navigationFromPath === pathname

  const startNavigation = React.useCallback(() => {
    setNavigationFromPath(pathname)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setNavigationFromPath(null), 15_000)
  }, [pathname])

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest("a")
      if (!anchor) return
      if (anchor.hasAttribute("download")) return
      if (anchor.getAttribute("target") === "_blank") return

      const href = anchor.getAttribute("href")
      if (!href) return
      if (href.startsWith("#")) return
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return

      let targetUrl: URL
      try {
        targetUrl = new URL(href, window.location.href)
        if (targetUrl.origin !== window.location.origin) return
        if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
          return
        }
      } catch {
        return
      }

      event.preventDefault()
      startNavigation()
      startTransition(() => {
        addTransitionType("nav-forward")
        router.push(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`)
      })
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [router, startNavigation])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const value = React.useMemo(
    () => ({ isNavigating, startNavigation }),
    [isNavigating, startNavigation],
  )

  return (
    <NavigationIndicatorContext.Provider value={value}>
      {children}
      <NavigationProgressBar active={isNavigating} />
    </NavigationIndicatorContext.Provider>
  )
}

export function useNavigationIndicator() {
  const value = React.useContext(NavigationIndicatorContext)
  if (!value) {
    throw new Error(
      "useNavigationIndicator must be used within NavigationIndicatorProvider",
    )
  }
  return value
}

function NavigationProgressBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent transition-opacity duration-150 motion-reduce:transition-none",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className="h-full w-1/3 animate-[nav-indeterminate_900ms_ease-in-out_infinite] bg-primary will-change-transform motion-reduce:animate-none"
      />
    </div>
  )
}
