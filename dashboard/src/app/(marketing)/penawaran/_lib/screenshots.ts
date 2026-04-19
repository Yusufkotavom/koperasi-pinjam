import { promises as fs } from "node:fs"
import path from "node:path"

export type Shot = {
  url: string
  name: string
  group: string
}

const GROUP_LABELS: Record<string, string> = {
  cooperative_manager_dashboard: "Dashboard Manager (Overview)",
  master_nasabah_client_data_management: "Master Nasabah",
  pengajuan_pinjaman_loan_application_form: "Pengajuan Pinjaman",
  kas_masuk_keluar_cash_flow_management: "Arus Kas (Kas Masuk/Keluar)",
  laporan_laba_rugi_profit_loss_report: "Laporan Laba Rugi",
  data_tunggakan_arrears_monitoring: "Monitoring Tunggakan (Aging)",
  settings_user_role_management: "Pengaturan (Role & Ranking)",
  login_cooperative_management_dashboard: "Login",
  vault_cooperative_management_landing_page: "Landing/Marketing",
  aequitas_ledger: "Ledger",
  equitas_pro: "Equitas Pro",
}

async function exists(p: string) {
  try {
    await fs.stat(p)
    return true
  } catch {
    return false
  }
}

export async function scanPenawaranScreenshots(): Promise<Shot[]> {
  // Convention:
  // - Put images under `public/snitch/project/<module>/...`
  // - Or `public/snitch/project/...` (flat).
  const publicDir = path.join(process.cwd(), "public")
  const root = path.join(publicDir, "snitch", "project")
  if (!(await exists(root))) return []

  const results: Shot[] = []

  async function walk(dir: string, group: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        await walk(full, group === "project" ? e.name : group)
        continue
      }
      const lower = e.name.toLowerCase()
      if (!lower.match(/\.(png|jpg|jpeg|webp)$/)) continue
      const rel = path.relative(publicDir, full).split(path.sep).join("/")
      results.push({
        url: `/${rel}`,
        name: e.name,
        group: group === "project" ? "umum" : group,
      })
    }
  }

  await walk(root, "project")
  return results.sort((a, b) => (a.group + a.name).localeCompare(b.group + b.name))
}

export function titleize(raw: string) {
  return raw
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

export function labelForGroup(group: string) {
  return GROUP_LABELS[group] ?? titleize(group)
}
