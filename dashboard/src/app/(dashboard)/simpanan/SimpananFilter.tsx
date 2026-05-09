"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

export function SimpananFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""

  function handleSearchChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    params.delete("page")
    router.push(`?${params.toString()}`)
  }

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
    <div className="flex gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cari nama, nomor rekening, atau NIK..."
          className="pl-8"
          defaultValue={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      <Select value={status || "all"} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="AKTIF">Aktif</SelectItem>
          <SelectItem value="TUTUP">Tutup</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
