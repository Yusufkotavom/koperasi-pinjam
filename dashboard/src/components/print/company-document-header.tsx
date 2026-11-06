import { getCompanyInfo } from "@/actions/settings"

export async function CompanyDocumentHeader({
  documentTitle,
  documentNumber,
  compact = true,
}: {
  documentTitle: string
  documentNumber?: string
  compact?: boolean
}) {
  const company = await getCompanyInfo()

  return (
    <div
      className={`flex justify-between items-start border-b-2 border-slate-800 ${
        compact ? "pb-3 mb-3 print:pb-2 print:mb-2.5" : "pb-4 mb-4"
      }`}
    >
      <div className="flex items-start gap-3">
        {company.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logoDataUrl}
            alt="Logo"
            className={`${
              compact ? "h-11 w-11" : "h-14 w-14"
            } rounded-md border border-slate-300 bg-white object-contain p-0.5 shrink-0`}
          />
        ) : null}
        <div>
          <h1
            className={`${
              compact
                ? "text-lg sm:text-xl print:text-lg"
                : "text-2xl sm:text-3xl print:text-xl"
            } font-extrabold tracking-tight text-slate-900 uppercase leading-tight`}
          >
            {company.name || "Koperasi Simpan Pinjam"}
          </h1>
          {company.tagline ? (
            <p className="text-[11px] sm:text-xs text-slate-600 leading-snug font-medium">
              {company.tagline}
            </p>
          ) : null}
          {company.address ? (
            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug line-clamp-1">
              {company.address}
            </p>
          ) : null}
          {company.phone || company.email || company.website ? (
            <p className="text-[10px] text-slate-500 leading-snug">
              {[company.phone, company.email, company.website]
                .filter(Boolean)
                .join(" • ")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="text-right shrink-0 pl-3">
        <h2
          className={`${
            compact ? "text-sm sm:text-base print:text-sm" : "text-lg sm:text-xl"
          } font-extrabold text-slate-900 uppercase tracking-wider leading-tight`}
        >
          {documentTitle}
        </h2>
        {documentNumber ? (
          <p className="text-[11px] sm:text-xs font-mono font-semibold text-slate-700 mt-0.5">
            {documentNumber}
          </p>
        ) : null}
      </div>
    </div>
  )
}
