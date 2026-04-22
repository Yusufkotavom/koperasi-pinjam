import { getRankingConfig } from "@/actions/settings"
import { RankingSettingsForm } from "../ranking-settings-form"

export default async function SettingsRankingPage() {
  const rankingConfig = await getRankingConfig()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ranking Risiko</h1>
        <p className="text-muted-foreground text-sm">
          Atur indikator kolektibilitas berdasarkan keterlambatan angsuran.
        </p>
      </div>
      <RankingSettingsForm initial={rankingConfig} />
    </div>
  )
}

