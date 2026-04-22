"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Copy, KeyRound, ShieldOff, ShieldCheck } from "lucide-react"
import type { PlatformUserRow, PlatformUserActionState } from "@/actions/platform-admin"
import { resetUserPasswordAction, setUserActiveAction } from "@/actions/platform-admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const initialUserState: PlatformUserActionState = { success: false, error: "" }

function copyToClipboard(value: string) {
  if (!value) return
  void navigator.clipboard.writeText(value)
}

export function UserAdminTable({ users }: { users: PlatformUserRow[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [selectedUserId, users],
  )

  const [resetState, resetAction, resetPending] = useActionState(resetUserPasswordAction, initialUserState)
  const [activeState, activeAction, activePending] = useActionState(setUserActiveAction, initialUserState)

  useEffect(() => {
    if (resetState.success) {
      toast.success(resetState.message)
      if (resetState.tempPassword) {
        toast.info("Temporary password dibuat. Salin dan kirim via channel aman.")
      }
    } else if ("error" in resetState && resetState.error) {
      toast.error(resetState.error)
    }
  }, [resetState])

  useEffect(() => {
    if (activeState.success) toast.success(activeState.message)
    else if ("error" in activeState && activeState.error) toast.error(activeState.error)
  }, [activeState])

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
        <CardTitle className="text-base font-semibold">Daftar User</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.company ? (
                      <span>
                        {u.company.name} <span className="text-xs">({u.company.status})</span>
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "secondary"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Dialog onOpenChange={(open) => setSelectedUserId(open ? u.id : null)}>
                      <DialogTrigger render={<Button size="sm" variant="outline" className="h-7 text-xs gap-1" />}>
                        <KeyRound className="size-3" /> Reset
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[460px]">
                        <form action={resetAction} className="space-y-4">
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Temporary password hanya ditampilkan sekali. Wajib isi reason.
                            </DialogDescription>
                          </DialogHeader>
                          <input type="hidden" name="userId" value={u.id} />
                          <div className="space-y-2">
                            <Label>User</Label>
                            <Input value={`${u.email}`} readOnly />
                          </div>
                          <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input name="reason" placeholder="Ticket/SOP/insiden..." disabled={resetPending} />
                          </div>
                          {resetState.success && resetState.tempPassword && selectedUser?.id === u.id ? (
                            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium">Temporary password</p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => copyToClipboard(resetState.tempPassword ?? "")}
                                >
                                  <Copy className="size-3" /> Copy
                                </Button>
                              </div>
                              <Input value={resetState.tempPassword} readOnly />
                            </div>
                          ) : null}
                          <DialogFooter>
                            <Button type="submit" disabled={resetPending}>
                              {resetPending ? "Memproses..." : "Reset Password"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog onOpenChange={(open) => setSelectedUserId(open ? u.id : null)}>
                      <DialogTrigger
                        render={<Button size="sm" variant={u.isActive ? "destructive" : "default"} className="h-7 text-xs gap-1" />}
                      >
                        {u.isActive ? <ShieldOff className="size-3" /> : <ShieldCheck className="size-3" />}
                        {u.isActive ? "Disable" : "Enable"}
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[460px]">
                        <form action={activeAction} className="space-y-4">
                          <DialogHeader>
                            <DialogTitle>{u.isActive ? "Nonaktifkan User" : "Aktifkan User"}</DialogTitle>
                            <DialogDescription>Wajib isi reason.</DialogDescription>
                          </DialogHeader>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="isActive" value={String(!u.isActive)} />
                          <div className="space-y-2">
                            <Label>User</Label>
                            <Input value={`${u.email}`} readOnly />
                          </div>
                          <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input name="reason" placeholder="Ticket/SOP/insiden..." disabled={activePending} />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={activePending} variant={u.isActive ? "destructive" : "default"}>
                              {activePending ? "Memproses..." : u.isActive ? "Disable" : "Enable"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
