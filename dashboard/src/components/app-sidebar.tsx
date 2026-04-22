"use client"

import * as React from "react"
import {
  LayoutDashboard, Users, FileText,
  FileBarChart, AlertTriangle, Building2, Landmark,
  BookOpen, LifeBuoy, Settings
} from "lucide-react"
import type { AccountingMode } from "@/lib/accounting-mode"

import { AppLink } from "@/components/app-link"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const baseNavMain = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: <LayoutDashboard />,
    isActive: true,
    items: [
      { title: "Dashboard", url: "/dashboard" },
      { title: "Roadmap Fitur", url: "/roadmap" },
      { title: "Panduan Pengguna", url: "/docs/panduan-pengguna" },
      { title: "Panduan Agent", url: "/docs/using-superpowers" },
    ],
  },
  {
    title: "Master Data",
    url: "#",
    icon: <Users />,
    items: [
      { title: "Nasabah (Daftar)", url: "/nasabah" },
      { title: "Nasabah Baru", url: "/nasabah/baru" },
      { title: "Kelompok", url: "/kelompok" },
      { title: "Kolektor", url: "/kolektor" },
    ],
  },
  {
    title: "Transaksi",
    url: "#",
    icon: <FileText />,
    items: [
      { title: "Pengajuan Pinjaman", url: "/pengajuan" },
      { title: "Pencairan", url: "/pencairan" },
      { title: "Pembayaran Angsuran", url: "/pembayaran" },
      { title: "Arus Kas", url: "/kas" },
    ],
  },
  {
    title: "Akuntansi",
    url: "#",
    icon: <Landmark />,
    items: [
      { title: "Daftar Akun (COA)", url: "/akuntansi/akun" },
      { title: "Mapping Kategori", url: "/akuntansi/mapping-kategori" },
    ],
  },
  {
    title: "Monitoring",
    url: "#",
    icon: <AlertTriangle />,
    items: [
      { title: "Tunggakan", url: "/monitoring/tunggakan" },
      { title: "Rekap Kolektor", url: "/monitoring/kolektor" },
    ],
  },
  {
    title: "Laporan",
    url: "#",
    icon: <FileBarChart />,
    items: [
      { title: "Transaksi User", url: "/laporan/transaksi-per-user" },
      { title: "Buku Besar", url: "/laporan/buku-besar" },
      { title: "Neraca", url: "/laporan/neraca" },
      { title: "Rekonsiliasi", url: "/laporan/rekonsiliasi" },
      { title: "Arus Kas", url: "/laporan/arus-kas" },
      { title: "Laba Rugi", url: "/laporan/laba-rugi" },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: <Settings />,
    items: [
      { title: "Ringkasan", url: "/settings" },
      { title: "Profil", url: "/settings/profile" },
      { title: "Company", url: "/settings/company" },
      { title: "User Company", url: "/settings/users" },
      { title: "Akuntansi", url: "/settings/accounting" },
      { title: "Ranking Risiko", url: "/settings/ranking" },
      { title: "Database", url: "/settings/maintenance" },
    ],
  },
]

const navSecondary = [
  {
    title: "Panduan",
    url: "/docs/panduan-pengguna",
    icon: <BookOpen />,
  },
  {
    title: "Support",
    url: "/docs/using-superpowers",
    icon: <LifeBuoy />,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar?: string
    roles?: string[]
    companyId?: string | null
  }
  company?: {
    name: string
    tagline?: string
    logoDataUrl?: string
  }
  accountingMode: AccountingMode
}

export function AppSidebar({ user, company, accountingMode, ...props }: AppSidebarProps) {
  const isCompanyUser = Boolean(user.companyId)
  const canManageSettings = user.roles?.some((role) => ["SUPER_ADMIN", "OWNER", "ADMIN"].includes(role)) ?? false

  return (
    <Sidebar {...props} variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<AppLink href="/dashboard" />}>
              {company?.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoDataUrl}
                  alt="Logo"
                  className="flex aspect-square size-8 items-center justify-center rounded-lg border border-border bg-background object-contain p-1"
                />
              ) : (
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
              )}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{company?.name || "KoperasiApp"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {company?.tagline || "Management Portal"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={baseNavMain.map((item) => {
            if (item.title === "Settings") {
              return {
                ...item,
                items: item.items.filter((navItem) => {
                  if (navItem.title === "User Company") return isCompanyUser
                  if (["Akuntansi", "Database"].includes(navItem.title)) return canManageSettings
                  return true
                }),
              }
            }

            if (item.title !== "Akuntansi") return item

            return {
              ...item,
              items: item.items.filter((navItem) => {
                if (navItem.title === "Daftar Akun (COA)") {
                  return accountingMode === "PROPER"
                }
                return true
              }),
            }
          })}
        />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
