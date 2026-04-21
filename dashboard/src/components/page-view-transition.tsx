"use client"

import * as React from "react"
import { ViewTransition } from "react"
import { usePathname } from "next/navigation"

export function PageViewTransition({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <ViewTransition
      default="none"
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "page-fade-in",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "page-fade-out",
      }}
    >
      <div key={pathname} className="min-h-svh">
        {children}
      </div>
    </ViewTransition>
  )
}
