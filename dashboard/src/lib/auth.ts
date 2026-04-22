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
            company: { select: { id: true, name: true, slug: true } },
          },
        })

        if (!user || !user.isActive) return null

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
      if (user) {
        // @ts-expect-error custom field
        token.roles = user.roles
        token.id = user.id
        // @ts-expect-error custom field
        token.companyId = user.companyId
        // @ts-expect-error custom field
        token.companyName = user.companyName
        // @ts-expect-error custom field
        token.companySlug = user.companySlug
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        // @ts-expect-error custom field
        session.user.roles = token.roles
        session.user.id = token.id as string
        // @ts-expect-error custom field
        session.user.companyId = token.companyId as string | null
        // @ts-expect-error custom field
        session.user.companyName = token.companyName as string | null
        // @ts-expect-error custom field
        session.user.companySlug = token.companySlug as string | null
      }
      return session
    },
  },
})
