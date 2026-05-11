"use server"

import { revalidatePath } from "next/cache"
import { RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { requireRoles } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { writeAuditLog } from "@/lib/audit"

type SessionLike = { user?: { id?: string } } | null

type NeonSnapshot = {
  id: string
  name: string | null
  source_branch_id: string
  created_at: string
  expires_at: string | null
}

function getNeonConfig() {
  const apiKey = process.env.NEON_API_KEY
  const projectId = process.env.NEON_PROJECT_ID
  const branchId = process.env.NEON_BRANCH_ID
  if (!apiKey) throw new Error("NEON_API_KEY belum di-set.")
  if (!projectId) throw new Error("NEON_PROJECT_ID belum di-set.")
  if (!branchId) throw new Error("NEON_BRANCH_ID belum di-set.")
  return { apiKey, projectId, branchId }
}

function getErrMessage(err: unknown) {
  if (err instanceof Error) return err.message
  return "Terjadi kesalahan server."
}

async function neonFetch(path: string, init?: RequestInit) {
  const { apiKey } = getNeonConfig()
  const res = await fetch(`https://console.neon.tech/api/v2${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Neon API ${res.status}: ${body.slice(0, 300)}`)
  }
  return res
}

async function requireSuperAdminActor() {
  const session = await auth()
  return requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN]).userId
}

export async function listNeonSnapshots(): Promise<NeonSnapshot[]> {
  await requireSuperAdminActor()
  const { projectId } = getNeonConfig()
  const res = await neonFetch(`/projects/${projectId}/snapshots`)
  const data = (await res.json()) as { snapshots?: NeonSnapshot[] }
  return data.snapshots ?? []
}

export async function createNeonSnapshotAction(formData: FormData): Promise<void> {
  const actorId = await requireSuperAdminActor()
  const { projectId, branchId } = getNeonConfig()
  const inputName = String(formData.get("name") ?? "").trim()
  const name = inputName.length > 0 ? inputName : `manual-${new Date().toISOString()}`

  try {
    const res = await neonFetch(`/projects/${projectId}/branches/${branchId}/snapshot`, {
      method: "POST",
      body: JSON.stringify({ name }),
    })
    const payload = await res.json()

    await writeAuditLog({
      actorId,
      entityType: "PLATFORM_BACKUP",
      action: "CREATE",
      metadata: {
        event: "NEON_CREATE_SNAPSHOT",
        projectId,
        branchId,
        snapshotName: name,
        result: payload,
      },
    })
  } catch (err) {
    await writeAuditLog({
      actorId,
      entityType: "PLATFORM_BACKUP",
      action: "CREATE",
      metadata: {
        event: "NEON_CREATE_SNAPSHOT_FAILED",
        projectId,
        branchId,
        snapshotName: name,
        error: getErrMessage(err),
      },
    })
    throw err
  }

  revalidatePath("/platform/backups")
}

export async function restoreNeonSnapshotToNewBranchAction(formData: FormData): Promise<void> {
  const actorId = await requireSuperAdminActor()
  const { projectId } = getNeonConfig()
  const snapshotId = String(formData.get("snapshotId") ?? "").trim()
  if (!snapshotId) throw new Error("snapshotId wajib diisi.")

  const name = `restore-${new Date().toISOString().replace(/[:.]/g, "-")}`

  try {
    const res = await neonFetch(`/projects/${projectId}/snapshots/${snapshotId}/restore`, {
      method: "POST",
      body: JSON.stringify({ name, finalize_restore: false }),
    })
    const payload = await res.json()

    await writeAuditLog({
      actorId,
      entityType: "PLATFORM_BACKUP",
      action: "UPDATE",
      metadata: {
        event: "NEON_RESTORE_SNAPSHOT_TO_NEW_BRANCH",
        projectId,
        snapshotId,
        branchName: name,
        result: payload,
      },
    })
  } catch (err) {
    await writeAuditLog({
      actorId,
      entityType: "PLATFORM_BACKUP",
      action: "UPDATE",
      metadata: {
        event: "NEON_RESTORE_SNAPSHOT_TO_NEW_BRANCH_FAILED",
        projectId,
        snapshotId,
        branchName: name,
        error: getErrMessage(err),
      },
    })
    throw err
  }

  revalidatePath("/platform/backups")
}

export async function getNeonBackupEnvStatus() {
  await requireSuperAdminActor()
  return {
    hasApiKey: Boolean(process.env.NEON_API_KEY),
    hasProjectId: Boolean(process.env.NEON_PROJECT_ID),
    hasBranchId: Boolean(process.env.NEON_BRANCH_ID),
  }
}

export async function getPlatformBackupAudit(limit = 20) {
  await requireSuperAdminActor()
  return prisma.auditLog.findMany({
    where: { entityType: "PLATFORM_BACKUP" },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
    include: { actor: { select: { name: true, email: true } } },
  })
}
