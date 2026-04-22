import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  logger: {
    error(error) {
      // Invalid credentials are expected during login attempts; avoid noisy server error logs.
      const raw = String(error)
      if (raw.includes("CredentialsSignin")) return
      console.error("[auth][error]", error)
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }).safeParse({
          email: typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "",
          password: typeof credentials?.password === "string" ? credentials.password : "",
        })

        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            roles: true,
            company: { select: { id: true, name: true, slug: true, status: true, isActive: true } },
          },
        })

        if (!user || !user.isActive) return null
        if (user.company && (!user.company.isActive || user.company.status !== "ACTIVE")) return null

        const passwordMatch = await bcrypt.compare(parsed.data.password, user.password)
        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles.map((r: { role: string }) => r.role),
          companyId: user.companyId,
          companyName: user.company?.name ?? null,
          companySlug: user.company?.slug ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as typeof token & {
        id?: string
        roles?: string[]
        companyId?: string | null
        companyName?: string | null
        companySlug?: string | null
      }

      if (user) {
        // @ts-expect-error custom field
        t.roles = user.roles
        t.id = user.id
        // @ts-expect-error custom field
        t.companyId = user.companyId
        // @ts-expect-error custom field
        t.companyName = user.companyName
        // @ts-expect-error custom field
        t.companySlug = user.companySlug
      }

      if (!t.id && token.sub) {
        t.id = token.sub
      }

      const needsHydration =
        !Array.isArray(t.roles) ||
        typeof t.id !== "string" ||
        t.id.length === 0 ||
        t.companyId === undefined

      if (needsHydration && typeof token.email === "string" && token.email.length > 0) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          include: {
            roles: true,
            company: { select: { id: true, name: true, slug: true } },
          },
        })

        if (dbUser) {
          t.id = dbUser.id
          t.roles = dbUser.roles.map((r) => r.role)
          t.companyId = dbUser.companyId
          t.companyName = dbUser.company?.name ?? null
          t.companySlug = dbUser.company?.slug ?? null
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        const t = token as typeof token & {
          id?: string
          roles?: string[]
          companyId?: string | null
          companyName?: string | null
          companySlug?: string | null
        }
        // @ts-expect-error custom field
        session.user.roles = Array.isArray(t.roles) ? t.roles : []
        session.user.id = (t.id ?? token.sub ?? "") as string
        // @ts-expect-error custom field
        session.user.companyId = (t.companyId ?? null) as string | null
        // @ts-expect-error custom field
        session.user.companyName = (t.companyName ?? null) as string | null
        // @ts-expect-error custom field
        session.user.companySlug = (t.companySlug ?? null) as string | null
      }
      return session
    },
  },
})
