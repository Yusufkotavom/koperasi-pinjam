import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

type GlobalPrisma = typeof globalThis & {
  pgPool?: Pool
  prisma?: PrismaClient
}

const globalForPrisma = globalThis as GlobalPrisma

function normalizeDatabaseUrl(raw?: string) {
  if (!raw) return raw
  try {
    const parsed = new URL(raw)
    const sslmode = parsed.searchParams.get("sslmode")?.toLowerCase()
    if (sslmode === "prefer" || sslmode === "require" || sslmode === "verify-ca") {
      parsed.searchParams.set("sslmode", "verify-full")
      parsed.searchParams.delete("uselibpqcompat")
      return parsed.toString()
    }
    return raw
  } catch {
    return raw
  }
}

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
  })

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool
  globalForPrisma.prisma = prisma
}
