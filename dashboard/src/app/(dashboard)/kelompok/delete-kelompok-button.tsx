"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteKelompok } from "@/actions/kelompok"
import { Button } from "@/components/ui/button"

export function DeleteKelompokButton({
  id,
  nama,
}: {
  id: string
  nama: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm(`Hapus kelompok "${nama}"? Anggota akan dilepas dari kelompok ini jika belum ada histori pengajuan.`)) {
      return
    }

    startTransition(async () => {
      const result = await deleteKelompok(id)
      if (!result.success) {
        toast.error(result.error ?? "Gagal menghapus kelompok.")
        return
      }

      toast.success("Kelompok berhasil dihapus.")
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
