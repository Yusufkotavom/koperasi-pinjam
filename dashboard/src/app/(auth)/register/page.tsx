"use client"

import Link from "next/link"
import { useActionState, useEffect, useRef, useState, useTransition, addTransitionType } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react"
import { registerUser, type RegisterState } from "@/actions/auth-registration"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const initialState: RegisterState = {}

export default function RegisterPage() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(registerUser, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const passwordRef = useRef("")
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!state.success || !state.email) return

    let cancelled = false

    async function loginAfterRegister() {
      setLoginError("")
      const res = await signIn("credentials", {
        email: state.email,
        password: passwordRef.current,
        redirect: false,
      })

      if (cancelled) return

      if (res?.error) {
        setLoginError("Akun dibuat, tetapi login otomatis gagal. Silakan masuk manual.")
        return
      }

      startTransition(() => {
        addTransitionType("nav-forward")
        router.push("/settings")
        router.refresh()
      })
    }

    loginAfterRegister()

    return () => {
      cancelled = true
    }
  }, [router, startTransition, state.email, state.success])

  const isSubmitting = pending || (state.success && !loginError)

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
            Buat akun pengelola<br />koperasi Anda
          </h1>
          <p className="text-emerald-100 text-lg leading-relaxed">
            Setelah akun dibuat, Anda langsung diarahkan ke pengaturan untuk melengkapi profil koperasi dan konfigurasi awal.
          </p>
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
            <h2 className="text-3xl font-bold tracking-tight">Daftar Akun</h2>
            <p className="text-muted-foreground mt-2">Buat company dan akun owner untuk mulai setup aplikasi</p>
          </div>

          <Card>
            <CardContent>
              <form action={formAction}>
                <FieldGroup className="gap-5">
                  {(state.message || loginError) && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="rounded-lg bg-muted p-3 text-sm text-muted-foreground"
                    >
                      {loginError || state.message}
                    </div>
                  )}
                  <Field data-invalid={!!state.errors?.name}>
                    <FieldLabel htmlFor="name">Nama</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Nama lengkap"
                      autoComplete="name"
                      aria-invalid={!!state.errors?.name}
                      disabled={isSubmitting}
                    />
                    <FieldError>{state.errors?.name?.[0]}</FieldError>
                  </Field>
                  <Field data-invalid={!!state.errors?.companyName}>
                    <FieldLabel htmlFor="companyName">Nama Koperasi</FieldLabel>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="Koperasi Demo Sejahtera"
                      autoComplete="organization"
                      aria-invalid={!!state.errors?.companyName}
                      disabled={isSubmitting}
                    />
                    <FieldError>{state.errors?.companyName?.[0]}</FieldError>
                  </Field>
                  <Field data-invalid={!!state.errors?.email}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@koperasi.id"
                      autoComplete="email"
                      spellCheck={false}
                      aria-invalid={!!state.errors?.email}
                      disabled={isSubmitting}
                    />
                    <FieldError>{state.errors?.email?.[0]}</FieldError>
                  </Field>
                  <Field data-invalid={!!state.errors?.password}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        autoComplete="new-password"
                        aria-invalid={!!state.errors?.password}
                        disabled={isSubmitting}
                        className="pr-10"
                        onChange={(event) => {
                          passwordRef.current = event.currentTarget.value
                        }}
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
                    <FieldError>{state.errors?.password?.[0]}</FieldError>
                  </Field>
                  <Field data-invalid={!!state.errors?.confirmPassword}>
                    <FieldLabel htmlFor="confirmPassword">Konfirmasi Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Ulangi password"
                        autoComplete="new-password"
                        aria-invalid={!!state.errors?.confirmPassword}
                        disabled={isSubmitting}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FieldError>{state.errors?.confirmPassword?.[0]}</FieldError>
                  </Field>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting} size="lg">
                    {isSubmitting && <Loader2 className="animate-spin" data-icon="inline-start" />}
                    {isSubmitting ? "Membuat akun…" : "Daftar & Setup"}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
