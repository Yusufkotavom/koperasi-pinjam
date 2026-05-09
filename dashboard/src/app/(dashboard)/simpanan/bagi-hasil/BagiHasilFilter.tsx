"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BagiHasilFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get("status") || ""

  function handleStatusChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set("status", value)
    } else {
      params.delete("status")
    }
    params.delete("page")
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={status || "all"} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Semua Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua Status</SelectItem>
        <SelectItem value="BELUM_BAYAR">Belum Bayar</SelectItem>
        <SelectItem value="SUDAH_BAYAR">Sudah Bayar</SelectItem>
      </SelectContent>
    </Select>
  )
}
