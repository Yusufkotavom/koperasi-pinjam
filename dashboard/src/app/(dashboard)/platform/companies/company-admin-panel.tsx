"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { CompanyStatus } from "@prisma/client"
import { Trash2, ShieldAlert } from "lucide-react"
import {
  setCompanyStatusAction,
  softDeleteCompanyAction,
  type SetCompanyStatusState,
} from "@/actions/platform-admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const initialState: SetCompanyStatusState = { success: false, error: "" }

export function CompanyAdminPanel(props: {
  companyId: string
  slug: string
  status: CompanyStatus
}) {
  const [status, setStatus] = useState<CompanyStatus>(props.status)
  const [setState, setAction, setPending] = useActionState(setCompanyStatusAction, initialState)
  const [delState, delAction, delPending] = useActionState(softDeleteCompanyAction, initialState)

  useEffect(() => {
    if (!setState) return
    if (setState.success) toast.success(setState.message)
    else if ("error" in setState && setState.error) toast.error(setState.error)
  }, [setState])

  useEffect(() => {
    if (!delState) return
    if (delState.success) toast.success(delState.message)
    else if ("error" in delState && delState.error) toast.error(delState.error)
  }, [delState])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Status Company <Badge variant={props.status === "ACTIVE" ? "default" : "secondary"}>{props.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={setAction} className="space-y-4">
            <input type="hidden" name="companyId" value={props.companyId} />
            <div className="space-y-2">
              <Label>Status Baru</Label>
              <input type="hidden" name="status" value={status} />
              <Select value={status} onValueChange={(v) => setStatus(v as CompanyStatus)} disabled={setPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  <SelectItem value="DELETED">DELETED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === "SUSPENDED" && (
              <div className="space-y-2">
                <Label>Suspended Until (opsional)</Label>
                <Input name="suspendedUntil" type="date" disabled={setPending} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason (wajib)</Label>
              <Input name="reason" placeholder="Contoh: pelanggaran kebijakan / permintaan owner / investigasi..." disabled={setPending} />
              {"fieldErrors" in setState ? (
                <p className="text-xs text-destructive">{setState.fieldErrors?.reason?.[0]}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={setPending} className="w-full">
              {setPending ? "Menyimpan..." : "Update Status"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-4" /> Soft Delete Company
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Soft delete akan mengubah status menjadi <span className="font-medium">DELETED</span> dan menonaktifkan seluruh user di company.
          </p>
          <form action={delAction} className="space-y-4">
            <input type="hidden" name="companyId" value={props.companyId} />
            <div className="space-y-2">
              <Label>Reason (wajib)</Label>
              <Input name="reason" placeholder="Contoh: request resmi, fraud, duplikasi company..." disabled={delPending} />
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi</Label>
              <Input name="confirm" placeholder={`Ketik: HAPUS ${props.slug}`} disabled={delPending} />
            </div>
            <Button type="submit" variant="destructive" disabled={delPending} className="w-full">
              <Trash2 className="size-4" />
              {delPending ? "Memproses..." : "Soft Delete"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

