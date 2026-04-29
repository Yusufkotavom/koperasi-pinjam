import { getKasHarian, getKasKategoriList } from "@/actions/kas"
import { KasClientPage } from "./kas-client"

export default async function KasPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string }>
}) {
  const sp = await searchParams
  const [data, kategori] = await Promise.all([
    getKasHarian({ from: sp?.from, to: sp?.to }),
    getKasKategoriList(),
  ])

  const normalized = {
    ...data,
    transaksi: data.transaksi.map((t) => ({
      id: t.id,
      tanggal: t.tanggal,
      jenis: t.jenis,
      kategori: t.kategoriKey,
      deskripsi: t.deskripsi,
      jumlah: Number(t.jumlah),
      kasJenis: t.kasJenis,
      buktiUrl: t.buktiUrl,
      isApproved: t.isApproved,
      inputOleh: t.inputOleh,
    })),
  }

  return <KasClientPage initialData={normalized} initialKategori={kategori} />
}
