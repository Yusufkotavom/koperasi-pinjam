import { getCompanyInfo } from "@/actions/settings"
import { CompanySettingsForm } from "../company-settings-form"

export default async function SettingsCompanyPage() {
  const companyInfo = await getCompanyInfo()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company</h1>
        <p className="text-muted-foreground text-sm">Kelola profil koperasi dan identitas dokumen.</p>
      </div>
      <CompanySettingsForm initial={companyInfo} />
    </div>
  )
}

