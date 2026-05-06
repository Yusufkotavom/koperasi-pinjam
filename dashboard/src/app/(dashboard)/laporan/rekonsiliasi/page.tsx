import { getRekonsiliasiKasList } from "@/actions/akuntansi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RekonsiliasiClient } from "./ui/rekonsiliasi-client"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { CompanyDocumentHeader } from "@/components/print/company-document-header"
import { AutoPrint } from "@/components/print/auto-print"

export default async function RekonsiliasiPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string; print?: string }>
}) {
  const sp = await searchParams
  const isPrint = sp?.print === "1"
  const data = await getRekonsiliasiKasList({ year: sp?.year })

  return (
    <div className="p-6 space-y-6">
      {isPrint ? <AutoPrint /> : null}
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } }`}</style>
      {isPrint ? <CompanyDocumentHeader documentTitle="Laporan Rekonsiliasi" documentNumber={sp?.year ?? "Semua Tahun"} /> : null}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekonsiliasi Kas/Bank</h1>
        <p className="text-muted-foreground text-sm">Bandingkan saldo sistem dengan saldo statement per periode</p>
        <div className="mt-3 flex items-center gap-2 print:hidden">
          <Button size="sm" variant="outline" asChild>
            <a href={`/api/export/rekonsiliasi?year=${sp?.year ?? ""}`}>
              <Download className="mr-1 size-3.5" /> Export CSV
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`?year=${sp?.year ?? ""}&print=1`} target="_blank" rel="noreferrer">
              <Download className="mr-1 size-3.5" /> Export PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <RekonsiliasiClient cashAccounts={data.cashAccounts} />
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Riwayat Rekonsiliasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data rekonsiliasi.</p>
                ) : (
                  data.rows.map((r) => (
                    <div key={r.id} className="rounded-lg border p-3 hover:bg-muted/20">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm">{r.account.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Periode {String(r.periodMonth).padStart(2, "0")}/{r.periodYear} · Dibuat oleh {r.createdBy.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${Number(r.selisih) === 0 ? "text-emerald-700" : "text-red-600"}`}>
                            Selisih: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(r.selisih))}
                          </p>
                          <p className="text-xs text-muted-foreground">Status: {r.status}</p>
                        </div>
                      </div>
                      {r.catatan ? <p className="mt-2 text-sm text-muted-foreground">{r.catatan}</p> : null}
                      {r.buktiUrl ? (
                        <a href={r.buktiUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-700 underline">
                          Lihat bukti
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
