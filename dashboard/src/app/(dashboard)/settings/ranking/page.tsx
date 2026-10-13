import { getCreditScoringConfig } from "@/actions/settings"
import { CreditScoringSettingsForm } from "../credit-scoring-settings-form"

export default async function SettingsRankingPage() {
  const creditConfig = await getCreditScoringConfig()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Credit Scoring & Plafon</h1>
        <p className="text-muted-foreground text-sm">
          Atur matriks skor performa pembayaran, kategori nasabah A–E, dan persentase
          penyesuaian plafon pinjaman.
        </p>
      </div>
      <CreditScoringSettingsForm initial={creditConfig} />
    </div>
  )
}
