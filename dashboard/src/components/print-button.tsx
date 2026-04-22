"use client"

import * as React from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export interface PrintButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function PrintButton({ className, variant, size, ...props }: PrintButtonProps) {
  return (
    <Button
      onClick={() => window.print()}
      variant={variant}
      size={size}
      className={cn(
        "gap-2",
        !variant && "bg-indigo-600 hover:bg-indigo-700 text-white",
        className
      )}
      {...props}
    >
      <Printer className="w-4 h-4" />
      Cetak / Simpan PDF
    </Button>
  )
}
