import { getDendaConfig } from "@/actions/settings"
import { DendaSettingsForm } from "./denda-settings-form"

export default async function SettingsDendaPage() {
  const dendaConfig = await getDendaConfig()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Denda</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi persentase atau nominal denda keterlambatan pembayaran.</p>
      </div>
      <DendaSettingsForm initial={dendaConfig} />
    </div>
  )
}
