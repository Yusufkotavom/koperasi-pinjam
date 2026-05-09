import { notFound } from "next/navigation"
import { getSimpananById } from "@/actions/simpanan"
import EditSimpananClient from "./edit-client"

export default async function EditSimpananPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const simpanan = await getSimpananById(id)

  if (!simpanan) {
    notFound()
  }

  return (
    <EditSimpananClient
      simpanan={{
        id: simpanan.id,
        namaPenyimpan: simpanan.namaPenyimpan,
        nik: simpanan.nik,
        noHp: simpanan.noHp,
        alamat: simpanan.alamat,
        persenBagiHasil: String(simpanan.persenBagiHasil),
        periodeBagiHasil: simpanan.periodeBagiHasil,
      }}
    />
  )
}
