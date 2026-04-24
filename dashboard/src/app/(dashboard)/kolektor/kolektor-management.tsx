"use client"

import { useState, useTransition } from "react"
import {
  createKolektorFromKetuaKelompok,
  createKolektorFromNasabah,
  createKolektorManual,
  payKolektorBonus,
  removeKolektor,
  updateKolektorBonus,
  updateKolektor,
} from "@/actions/kolektor"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { CheckCircle2, Pencil, ShieldCheck, Trash2, UserPlus, Users, Wallet } from "lucide-react"

type Props = {
  initialKolektor: {
    id: string
    name: string
    email: string
    isActive: boolean
    roles: string[]
    totalNasabah: number
    bonusReadyCount: number
    bonusReadyNominal: number
    bonusPaidCount: number
    bonusPaidNominal: number
  }[]
  bonusList: {
    id: string
    nominal: number
    status: string
    eligibleAt: string | null
    paidAt: string | null
    catatan: string
    kolektor: { id: string; name: string; email: string; isActive: boolean }
    paidBy: { id: string; name: string } | null
    pinjaman: {
      id: string
      nomorKontrak: string
      status: string
      tanggalCair: string
      nasabah: { id: string; namaLengkap: string; nomorAnggota: string }
    }
  }[]
  sumberOptions: {
    nasabah: { id: string; namaLengkap: string; noHp: string }[]
    kelompok: { id: string; kode: string; nama: string; ketua: string | null }[]
  }
  roleTable: {
    id: string
    name: string
    email: string
    isActive: boolean
    roles: string[]
  }[]
}

function fmtCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function todayInputValue() {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function KolektorManagement({ initialKolektor, bonusList, sumberOptions, roleTable }: Props) {
  const [isPending, startTransition] = useTransition()
  const [manualName, setManualName] = useState("")
  const [manualEmail, setManualEmail] = useState("")
  const [manualPassword, setManualPassword] = useState("Kolektor123")
  const [manualAdmin, setManualAdmin] = useState(false)

  const [nasabahId, setNasabahId] = useState("")
  const [nasabahAdmin, setNasabahAdmin] = useState(false)

  const [kelompokId, setKelompokId] = useState("")
  const [kelompokAdmin, setKelompokAdmin] = useState(false)

  const run = (fn: () => Promise<{ success?: boolean; error?: string }>, successMessage = "Data kolektor berhasil diperbarui.") => {
    startTransition(async () => {
      const result = await fn()
      if (!result?.success) {
        toast.error(result?.error ?? "Gagal memproses data kolektor.")
        return
      }
      toast.success(successMessage)
      window.location.reload()
    })
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Kolektor & Role</h1>
        <p className="text-muted-foreground text-sm">Kelola hak akses petugas lapangan dan administrator sistem.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-1">
               <UserPlus className="size-4 text-primary" />
               <CardTitle className="text-base font-semibold">Input Manual</CardTitle>
            </div>
            <CardDescription>Tambah petugas baru secara langsung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</Label>
              <Input value={manualName} onChange={(e) => setManualName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</Label>
              <Input type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password Sementara</Label>
              <Input value={manualPassword} onChange={(e) => setManualPassword(e.target.value)} />
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
               <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                 <input type="checkbox" className="size-4 rounded-md border-slate-300 text-primary focus:ring-primary/20" checked={manualAdmin} onChange={(e) => setManualAdmin(e.target.checked)} /> 
                 Tambah role ADMIN
               </label>
            </div>
            <Button disabled={isPending} className="w-full h-10 font-bold uppercase tracking-widest text-[10px]" onClick={() => run(() => createKolektorManual({ name: manualName, email: manualEmail, password: manualPassword, isAdmin: manualAdmin }))}>Simpan Kolektor</Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-1">
               <Users className="size-4 text-primary" />
               <CardTitle className="text-base font-semibold">Promosi Nasabah</CardTitle>
            </div>
            <CardDescription>Jadikan nasabah aktif sebagai petugas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pilih Nasabah</Label>
              <select className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900" value={nasabahId} onChange={(e) => setNasabahId(e.target.value)}>
                <option value="">Pilih nasabah...</option>
                {sumberOptions.nasabah.map((n) => (
                  <option key={n.id} value={n.id}>{n.namaLengkap}</option>
                ))}
              </select>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
               <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                 <input type="checkbox" className="size-4 rounded-md border-slate-300 text-primary focus:ring-primary/20" checked={nasabahAdmin} onChange={(e) => setNasabahAdmin(e.target.checked)} /> 
                 Tambah role ADMIN
               </label>
            </div>
            <Button disabled={isPending || !nasabahId} className="w-full h-10 font-bold uppercase tracking-widest text-[10px]" onClick={() => run(() => createKolektorFromNasabah({ nasabahId, isAdmin: nasabahAdmin }))}>Jadikan Kolektor</Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-1">
               <ShieldCheck className="size-4 text-primary" />
               <CardTitle className="text-base font-semibold">Promosi Ketua</CardTitle>
            </div>
            <CardDescription>Tetapkan ketua kelompok sebagai petugas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pilih Kelompok</Label>
              <select className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900" value={kelompokId} onChange={(e) => setKelompokId(e.target.value)}>
                <option value="">Pilih kelompok...</option>
                {sumberOptions.kelompok.map((k) => (
                  <option key={k.id} value={k.id}>{k.kode} - {k.nama}</option>
                ))}
              </select>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
               <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                 <input type="checkbox" className="size-4 rounded-md border-slate-300 text-primary focus:ring-primary/20" checked={kelompokAdmin} onChange={(e) => setKelompokAdmin(e.target.checked)} /> 
                 Tambah role ADMIN
               </label>
            </div>
            <Button disabled={isPending || !kelompokId} className="w-full h-10 font-bold uppercase tracking-widest text-[10px]" onClick={() => run(() => createKolektorFromKetuaKelompok({ kelompokId, isAdmin: kelompokAdmin }))}>Tetapkan Kolektor Kelompok</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Bonus Siap Dibayar</CardDescription>
            <CardTitle className="text-2xl">
              {fmtCurrency(bonusList.filter((item) => item.status === "READY").reduce((sum, item) => sum + item.nominal, 0))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {bonusList.filter((item) => item.status === "READY").length} bonus menunggu pencairan
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total Sudah Dibayar</CardDescription>
            <CardTitle className="text-2xl">
              {fmtCurrency(bonusList.filter((item) => item.status === "PAID").reduce((sum, item) => sum + item.nominal, 0))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {bonusList.filter((item) => item.status === "PAID").length} bonus sudah dicairkan
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total Bonus Pending</CardDescription>
            <CardTitle className="text-2xl">
              {fmtCurrency(bonusList.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + item.nominal, 0))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Menjadi siap bayar otomatis saat pinjaman lunas
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
            <CardTitle className="text-base font-semibold">Kolektor Lapangan</CardTitle>
            <CardDescription>Daftar akun yang memiliki role kolektor, aktif maupun nonaktif</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nama Petugas</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Nasabah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialKolektor.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold tracking-tight text-slate-900 dark:text-slate-200">{k.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{k.email}</span>
                        <span className="text-[10px] text-muted-foreground">
                          Ready {k.bonusReadyCount} · {fmtCurrency(k.bonusReadyNominal)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge className={`${k.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"} border-0 h-5 px-1.5 text-[9px] font-black uppercase tracking-tight rounded-md`}>
                          {k.isActive ? "AKTIF" : "NONAKTIF"}
                        </Badge>
                         {k.roles.map((r) => (
                           <Badge key={r} className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0 h-5 px-1.5 text-[9px] font-black uppercase tracking-tight rounded-md">{r}</Badge>
                         ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="text-right">
                          <div className="text-sm font-bold tracking-tight text-primary">{k.totalNasabah.toLocaleString("id-ID")} nasabah</div>
                          <div className="text-[10px] text-muted-foreground">Paid {fmtCurrency(k.bonusPaidNominal)}</div>
                        </div>
                        <EditKolektorDialog
                          kolektor={k}
                          disabled={isPending}
                          onSubmit={(payload) => run(() => updateKolektor(payload), "Data kolektor berhasil diubah.")}
                        />
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => {
                            const confirmed = window.confirm(
                              k.totalNasabah > 0
                                ? `${k.name} akan dicabut dari kolektor dan ${k.totalNasabah} nasabah akan dilepas dari kolektor ini. Lanjutkan?`
                                : `Cabut role kolektor untuk ${k.name}?`
                            )
                            if (!confirmed) return
                            run(() => removeKolektor({ id: k.id }), "Role kolektor berhasil dicabut.")
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
            <CardTitle className="text-base font-semibold">Semua User & Role</CardTitle>
            <CardDescription>Daftar semua akun yang memiliki akses ke dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daftar Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleTable.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                       <div className="flex flex-col">
                         <span className="font-bold tracking-tight text-slate-900 dark:text-slate-200">{u.name}</span>
                         <span className="text-[10px] text-muted-foreground font-medium">{u.email}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${u.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"} border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2`}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex gap-1.5 flex-wrap">
                         {u.roles.map((r) => (
                           <Badge key={r} variant="outline" className="border-slate-200 dark:border-slate-800 h-5 px-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tight rounded-md">{r}</Badge>
                         ))}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <CardTitle className="text-base font-semibold">Bonus Kolektor per Pinjaman</CardTitle>
          <CardDescription>Bonus menjadi siap dibayar saat pinjaman lunas. Pembayaran bonus akan tercatat sebagai kas keluar.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Kolektor / Nasabah</TableHead>
                <TableHead>Pinjaman</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonusList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada bonus kolektor.
                  </TableCell>
                </TableRow>
              ) : (
                bonusList.map((bonus) => (
                  <TableRow key={bonus.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold tracking-tight">{bonus.kolektor.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {bonus.pinjaman.nasabah.namaLengkap} · {bonus.pinjaman.nasabah.nomorAnggota}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{bonus.pinjaman.nomorKontrak}</span>
                        <span className="text-[10px] text-muted-foreground">
                          Cair {formatDate(bonus.pinjaman.tanggalCair)} · Siap {formatDate(bonus.eligibleAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={`${bonus.status === "READY" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : bonus.status === "PAID" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : bonus.status === "CANCELED" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"} border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2`}>
                          {bonus.status}
                        </Badge>
                        {bonus.paidAt ? (
                          <span className="text-[10px] text-muted-foreground">
                            Dibayar {formatDate(bonus.paidAt)} oleh {bonus.paidBy?.name ?? "-"}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{fmtCurrency(bonus.nominal)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditBonusDialog
                          bonus={bonus}
                          disabled={isPending || bonus.status === "PAID" || bonus.status === "CANCELED"}
                          onSubmit={(payload) => run(() => updateKolektorBonus(payload), "Nominal bonus berhasil diperbarui.")}
                        />
                        <PayBonusDialog
                          bonus={bonus}
                          disabled={isPending || bonus.status !== "READY"}
                          onSubmit={(payload) => run(() => payKolektorBonus(payload), "Bonus kolektor berhasil dibayarkan.")}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function EditKolektorDialog({
  kolektor,
  disabled,
  onSubmit,
}: {
  kolektor: Props["initialKolektor"][number]
  disabled: boolean
  onSubmit: (payload: { id: string; name: string; email: string; isActive: boolean; isAdmin: boolean }) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(kolektor.name)
  const [email, setEmail] = useState(kolektor.email)
  const [isActive, setIsActive] = useState(kolektor.isActive)
  const [isAdmin, setIsAdmin] = useState(kolektor.roles.includes("ADMIN"))

  const reset = () => {
    setName(kolektor.name)
    setEmail(kolektor.email)
    setIsActive(kolektor.isActive)
    setIsAdmin(kolektor.roles.includes("ADMIN"))
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next)
      if (!next) reset()
    }}>
      <DialogTrigger
        render={
          <Button type="button" size="icon-xs" variant="outline" disabled={disabled} />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Kolektor</DialogTitle>
          <DialogDescription>Ubah identitas akun kolektor atau nonaktifkan akses login.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/30">
            <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                className="size-4 rounded-md border-slate-300 text-primary focus:ring-primary/20"
                checked={isAdmin}
                onChange={(event) => setIsAdmin(event.target.checked)}
              />
              Tambahkan role ADMIN
            </label>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/30">
            <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                className="size-4 rounded-md border-slate-300 text-primary focus:ring-primary/20"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Akun aktif
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={disabled || !name.trim() || !email.trim()}
            onClick={() => {
              onSubmit({
                id: kolektor.id,
                name,
                email,
                isActive,
                isAdmin,
              })
              setOpen(false)
            }}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditBonusDialog({
  bonus,
  disabled,
  onSubmit,
}: {
  bonus: Props["bonusList"][number]
  disabled: boolean
  onSubmit: (payload: { id: string; nominal: number; catatan?: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [nominal, setNominal] = useState(bonus.nominal)
  const [catatan, setCatatan] = useState(bonus.catatan)

  const reset = () => {
    setNominal(bonus.nominal)
    setCatatan(bonus.catatan)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger
        render={<Button type="button" size="icon-xs" variant="outline" disabled={disabled} />}
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Bonus Kolektor</DialogTitle>
          <DialogDescription>Sesuaikan nominal bonus untuk pinjaman ini sebelum dibayarkan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nominal Bonus</Label>
            <Input type="number" value={nominal || ""} onChange={(event) => setNominal(Number(event.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Input value={catatan} onChange={(event) => setCatatan(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={disabled || nominal < 0}
            onClick={() => {
              onSubmit({ id: bonus.id, nominal, catatan })
              setOpen(false)
            }}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PayBonusDialog({
  bonus,
  disabled,
  onSubmit,
}: {
  bonus: Props["bonusList"][number]
  disabled: boolean
  onSubmit: (payload: { id: string; kasJenis: "TUNAI" | "BANK"; tanggalBayar: string; catatan?: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [kasJenis, setKasJenis] = useState<"TUNAI" | "BANK">("TUNAI")
  const [tanggalBayar, setTanggalBayar] = useState(todayInputValue())
  const [catatan, setCatatan] = useState("")

  const reset = () => {
    setKasJenis("TUNAI")
    setTanggalBayar(todayInputValue())
    setCatatan("")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger
        render={<Button type="button" size="icon-xs" disabled={disabled} />}
      >
        <Wallet />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bayar Bonus Kolektor</DialogTitle>
          <DialogDescription>
            {bonus.kolektor.name} akan menerima bonus {fmtCurrency(bonus.nominal)} untuk {bonus.pinjaman.nasabah.namaLengkap}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sumber Dana</Label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900"
              value={kasJenis}
              onChange={(event) => setKasJenis(event.target.value as "TUNAI" | "BANK")}
            >
              <option value="TUNAI">Kas Tunai</option>
              <option value="BANK">Kas Bank</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Bayar</Label>
            <Input type="date" value={tanggalBayar} onChange={(event) => setTanggalBayar(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Input value={catatan} onChange={(event) => setCatatan(event.target.value)} placeholder="Opsional" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => {
              onSubmit({ id: bonus.id, kasJenis, tanggalBayar, catatan })
              setOpen(false)
            }}
          >
            <CheckCircle2 />
            Bayar Bonus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
