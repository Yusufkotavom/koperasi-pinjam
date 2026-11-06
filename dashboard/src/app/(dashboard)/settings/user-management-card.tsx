"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Plus, Users, Pencil, KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { RoleType } from "@prisma/client"
import {
  createCompanyUser,
  updateCompanyUser,
  changeCompanyUserPassword,
  type CompanyUserRow,
  type CreateCompanyUserState,
} from "@/actions/company-users"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const initialState: CreateCompanyUserState = {}

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "TELLER", label: "Teller" },
  { value: "KOLEKTOR", label: "Kolektor" },
  { value: "SURVEYOR", label: "Surveyor" },
  { value: "MANAGER", label: "Manager" },
  { value: "PIMPINAN", label: "Pimpinan" },
  { value: "AKUNTANSI", label: "Akuntansi" },
]

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Owner",
  ADMIN: "Admin",
  TELLER: "Teller",
  KOLEKTOR: "Kolektor",
  SURVEYOR: "Surveyor",
  MANAGER: "Manager",
  PIMPINAN: "Pimpinan",
  AKUNTANSI: "Akuntansi",
}

export function UserManagementCard({ users }: { users: CompanyUserRow[] }) {
  const [state, action, pending] = useActionState(createCompanyUser, initialState)
  const [role, setRole] = useState("TELLER")
  const formRef = useRef<HTMLFormElement>(null)

  // State untuk Dialog Edit User
  const [editUser, setEditUser] = useState<CompanyUserRow | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState<string>("TELLER")
  const [editIsActive, setEditIsActive] = useState(true)
  const [editPending, setEditPending] = useState(false)

  // State untuk Dialog Ubah Password
  const [passwordUser, setPasswordUser] = useState<CompanyUserRow | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordPending, setPasswordPending] = useState(false)

  useEffect(() => {
    if (!state.message) return

    if (state.success) {
      toast.success(state.message)
      formRef.current?.reset()
    } else {
      toast.error(state.message)
    }
  }, [state.message, state.success])

  const handleOpenEdit = (user: CompanyUserRow) => {
    setEditUser(user)
    setEditName(user.name)
    setEditRole(user.roles[0] || "TELLER")
    setEditIsActive(user.isActive)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return

    if (editName.trim().length < 2) {
      toast.error("Nama minimal 2 karakter")
      return
    }

    setEditPending(true)
    try {
      const res = await updateCompanyUser({
        userId: editUser.id,
        name: editName.trim(),
        role: editRole as RoleType,
        isActive: editIsActive,
      })

      if (res.success) {
        toast.success(res.message || "User berhasil diperbarui")
        setEditUser(null)
      } else {
        toast.error(res.error || "Gagal memperbarui user")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem")
    } finally {
      setEditPending(false)
    }
  }

  const handleOpenPassword = (user: CompanyUserRow) => {
    setPasswordUser(user)
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordUser) return

    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok")
      return
    }

    setPasswordPending(true)
    try {
      const res = await changeCompanyUserPassword({
        userId: passwordUser.id,
        newPassword,
      })

      if (res.success) {
        toast.success(res.message || "Password berhasil diubah")
        setPasswordUser(null)
      } else {
        toast.error(res.error || "Gagal mengubah password")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem")
    } finally {
      setPasswordPending(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" /> User Company
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
          <form ref={formRef} action={action} className="rounded-lg border bg-muted/20 p-4">
            <FieldGroup className="gap-4">
              <input type="hidden" name="role" value={role} />
              <Field data-invalid={!!state.errors?.name}>
                <FieldLabel htmlFor="new-user-name">Nama</FieldLabel>
                <Input
                  id="new-user-name"
                  name="name"
                  placeholder="Nama user"
                  autoComplete="name"
                  disabled={pending}
                />
                <FieldError>{state.errors?.name?.[0]}</FieldError>
              </Field>
              <Field data-invalid={!!state.errors?.email}>
                <FieldLabel htmlFor="new-user-email">Email</FieldLabel>
                <Input
                  id="new-user-email"
                  name="email"
                  type="email"
                  placeholder="user@koperasi.id"
                  autoComplete="email"
                  spellCheck={false}
                  disabled={pending}
                />
                <FieldError>{state.errors?.email?.[0]}</FieldError>
              </Field>
              <Field data-invalid={!!state.errors?.password}>
                <FieldLabel htmlFor="new-user-password">Password</FieldLabel>
                <Input
                  id="new-user-password"
                  name="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  disabled={pending}
                />
                <FieldError>{state.errors?.password?.[0]}</FieldError>
              </Field>
              <Field data-invalid={!!state.errors?.role}>
                <FieldLabel>Role</FieldLabel>
                <Select value={role} onValueChange={setRole} disabled={pending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{state.errors?.role?.[0]}</FieldError>
              </Field>
              <Button type="submit" disabled={pending} className="w-full">
                <Plus className="size-4" />
                {pending ? "Menyimpan..." : "Buat User"}
              </Button>
            </FieldGroup>
          </form>

          <div className="min-w-0 rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[170px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada user company.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((item) => (
                            <Badge key={item} variant="secondary">
                              {roleLabels[item] ?? item}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <Pencil className="size-3" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => handleOpenPassword(user)}
                          >
                            <KeyRound className="size-3" /> Password
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Edit User */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit User Company</DialogTitle>
              <DialogDescription>
                Perbarui profil dan wewenang akun internal koperasi.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="edit-user-email">Email</FieldLabel>
                <Input
                  id="edit-user-email"
                  value={editUser?.email || ""}
                  readOnly
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Email akun tidak dapat diubah demi keamanan integrasi.
                </p>
              </div>

              <div className="space-y-1.5">
                <FieldLabel htmlFor="edit-user-name">Nama Lengkap</FieldLabel>
                <Input
                  id="edit-user-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama user"
                  required
                  disabled={editPending}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Role / Wewenang</FieldLabel>
                <Select
                  value={editRole}
                  onValueChange={setEditRole}
                  disabled={editPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Status Akun</FieldLabel>
                <Select
                  value={editIsActive ? "ACTIVE" : "INACTIVE"}
                  onValueChange={(val) => setEditIsActive(val === "ACTIVE")}
                  disabled={editPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif (Dapat Login)</SelectItem>
                    <SelectItem value="INACTIVE">Nonaktif (Akses Diblokir)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditUser(null)}
                disabled={editPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={editPending}>
                {editPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Ubah Password User */}
      <Dialog
        open={!!passwordUser}
        onOpenChange={(open) => !open && setPasswordUser(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleSavePassword}>
            <DialogHeader>
              <DialogTitle>Ubah Password User</DialogTitle>
              <DialogDescription>
                Atur password baru untuk akun <strong>{passwordUser?.name}</strong> ({passwordUser?.email}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="new-password">Password Baru</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  disabled={passwordPending}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel htmlFor="confirm-password">Ulangi Password Baru</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  required
                  disabled={passwordPending}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordUser(null)}
                disabled={passwordPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={passwordPending}>
                {passwordPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Password Baru"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
