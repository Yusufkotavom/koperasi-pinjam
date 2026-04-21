"use client"

import * as React from "react"
import { CalendarDays, Plus, Bell, User, Search, UserPlus, ClipboardList, CreditCard, PiggyBank, Sun, Moon, Laptop } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useTransition, addTransitionType } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { useNavigationIndicator } from "@/components/navigation-indicator"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export function TopBar() {
  const [date, setDate] = React.useState<Date>(() => new Date())
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { setTheme } = useTheme()
  const { startNavigation } = useNavigationIndicator()

  React.useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const navigate = (url: string) => {
    startNavigation()
    startTransition(() => {
      addTransitionType("nav-forward")
      router.push(url)
    })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-background/80 px-4 shadow-sm backdrop-blur-xl transition-[height,box-shadow,background-color] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 bg-border data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  navigate("/")
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground uppercase text-[10px] tracking-widest">Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end max-w-4xl">
        {/* Search Input */}
        <div className="relative hidden lg:flex items-center flex-1 max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" data-icon="inline-start" />
          <Input
            type="search"
            name="global-search"
            aria-label="Cari nasabah atau transaksi"
            placeholder="Cari nasabah atau transaksi…"
            autoComplete="off"
            className="h-9 w-full bg-background/70 pl-9 transition-[background-color,border-color,box-shadow] focus-visible:border-ring"
          />
        </div>

        {/* Date Header */}
        <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-muted/45 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-xs xl:flex">
          <CalendarDays className="size-3.5 text-muted-foreground" data-icon="inline-start" />
          <span className="text-muted-foreground" suppressHydrationWarning>
            {format(date, "EEEE, d MMMM yyyy", { locale: id })}
          </span>
        </div>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Ubah tema">
              <Sun className="rotate-0 scale-100 transition-[transform,opacity] dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute rotate-90 scale-0 transition-[transform,opacity] dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl p-1 shadow-lg">
            <DropdownMenuItem onSelect={() => setTheme("light")} className="rounded-lg gap-2">
              <Sun className="text-muted-foreground" data-icon="inline-start" />
              <span className="text-xs font-bold uppercase tracking-tight">Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("dark")} className="rounded-lg gap-2">
              <Moon className="text-muted-foreground" data-icon="inline-start" />
              <span className="text-xs font-bold uppercase tracking-tight">Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("system")} className="rounded-lg gap-2">
              <Laptop className="text-muted-foreground" data-icon="inline-start" />
              <span className="text-xs font-bold uppercase tracking-tight">System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-background/70 font-bold uppercase tracking-widest text-[10px] shadow-xs">
              <Plus data-icon="inline-start" />
              <span className="hidden sm:inline">Quick Action</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-xl">
            <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tambah Data Baru</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem onSelect={() => navigate("/nasabah/baru")} className="rounded-lg py-2">
              <UserPlus className="text-muted-foreground" data-icon="inline-start" />
              <span className="font-semibold text-sm">Nasabah Baru</span>
              <DropdownMenuShortcut className="text-[10px]">⌘N</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/pengajuan")} className="rounded-lg py-2">
              <ClipboardList className="text-muted-foreground" data-icon="inline-start" />
              <span className="font-semibold text-sm">Pengajuan Pinjaman</span>
              <DropdownMenuShortcut className="text-[10px]">⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/pembayaran")} className="rounded-lg py-2">
              <CreditCard className="text-muted-foreground" data-icon="inline-start" />
              <span className="font-semibold text-sm">Input Pembayaran</span>
              <DropdownMenuShortcut className="text-[10px]">⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem onSelect={() => navigate("/kas")} className="rounded-lg py-2">
              <PiggyBank className="text-muted-foreground" data-icon="inline-start" />
              <span className="font-semibold text-sm">Input Kas Harian</span>
              <DropdownMenuShortcut className="text-[10px]">⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Buka notifikasi">
            <Bell />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Buka profil pengguna">
            <User />
          </Button>
        </div>
      </div>
    </header>
  )
}
