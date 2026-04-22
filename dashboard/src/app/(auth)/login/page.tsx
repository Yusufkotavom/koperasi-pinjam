"use client"

import { useState, useSyncExternalStore, useTransition, addTransitionType } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

type LoginForm = z.infer<typeof loginSchema>

const subscribeNoop = () => () => {}
const getDemoTextSnapshot = () => "admin@koperasi.id / admin123"
// Keep server + client snapshot identical to avoid hydration mismatch.
const getEmptySnapshot = getDemoTextSnapshot

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const demoText = useSyncExternalStore(subscribeNoop, getDemoTextSnapshot, getEmptySnapshot)
  const [, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    setError("")
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    setIsLoading(false)
    if (res?.error) {
      setError("Email atau password salah.")
    } else {
      startTransition(() => {
        addTransitionType("nav-forward")
        router.push("/dashboard")
        router.refresh()
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_24rem),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.55))]">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/15 bg-white/20 p-2 backdrop-blur">
            <Building2 className="size-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight">KoperasiApp</span>
        </div>
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold leading-tight">
            Sistem Informasi<br />Koperasi Simpan Pinjam
          </h1>
          <p className="text-emerald-100 text-lg leading-relaxed">
            Kelola nasabah, pinjaman, angsuran, dan laporan keuangan koperasi Anda dengan mudah, aman, dan terpercaya.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: "Nasabah Aktif", value: "1.2K+" },
              { label: "Pinjaman", value: "840+" },
              { label: "Akurasi Data", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-emerald-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-emerald-200 text-sm">© 2024 KoperasiApp. All rights reserved.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-emerald-600 rounded-xl p-2 text-white">
              <Building2 className="size-6" />
            </div>
            <span className="text-xl font-bold">KoperasiApp</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">Selamat Datang</h2>
            <p className="text-muted-foreground mt-2">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <Card>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FieldGroup className="gap-5">
                  {error && (
                    <div role="alert" aria-live="polite" className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <Field data-invalid={!!errors.email}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@koperasi.id…"
                      autoComplete="email"
                      spellCheck={false}
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                    <FieldError>{errors.email?.message}</FieldError>
                  </Field>
                  <Field data-invalid={!!errors.password}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password…"
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                        {...register("password")}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FieldError>{errors.password?.message}</FieldError>
                  </Field>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading} size="lg">
                    {isLoading && <Loader2 className="animate-spin" data-icon="inline-start" />}
                    {isLoading ? "Masuk…" : "Masuk"}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
              Daftar
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Demo:</span>{" "}
            {demoText}
          </p>
        </div>
      </div>
    </div>
  )
}
