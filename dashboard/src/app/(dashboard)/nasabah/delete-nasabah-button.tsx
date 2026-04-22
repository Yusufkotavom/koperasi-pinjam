"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteNasabah } from "@/actions/nasabah"
import { Button } from "@/components/ui/button"

export function DeleteNasabahButton({
  id,
  nama,
}: {
  id: string
  nama: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm(`Hapus nasabah "${nama}"? Data yang sudah punya histori transaksi tidak akan bisa dihapus.`)) {
      return
    }

    startTransition(async () => {
      const result = await deleteNasabah(id)
      if (!result.success) {
        toast.error(result.error ?? "Gagal menghapus nasabah.")
        return
      }

      toast.success("Nasabah berhasil dihapus.")
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
      title="Hapus"
      disabled={isPending}
      onClick={handleDelete}
    >
      <Trash2 className="size-4" />
      <span className="sr-only">Hapus</span>
    </Button>
  )
}
