"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Plus, Users } from "lucide-react"
import { toast } from "sonner"
import {
  createCompanyUser,
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

  useEffect(() => {
    if (!state.message) return

    if (state.success) {
      toast.success(state.message)
      formRef.current?.reset()
    } else {
      toast.error(state.message)
    }
  }, [state.message, state.success])

  return (
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

        <div className="min-w-0 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
