import { put } from "@vercel/blob"
import path from "node:path"
import { randomUUID } from "node:crypto"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
])

function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  return token && token.length > 0 ? token : undefined
}

export function validateUploadFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return `Tipe file tidak didukung: ${file.name}`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Ukuran file melebihi 5 MB: ${file.name}`
  }
  return null
}

type UploadPolicy = {
  maxFileSize?: number
  allowedTypes?: Set<string> | string[]
}

export function validateUploadFileWithPolicy(file: File, policy?: UploadPolicy): string | null {
  const allowedTypes =
    policy?.allowedTypes instanceof Set ? policy.allowedTypes : new Set(policy?.allowedTypes ?? ALLOWED_TYPES)
  const maxFileSize = policy?.maxFileSize ?? MAX_FILE_SIZE

  if (!allowedTypes.has(file.type)) {
    return `Tipe file tidak didukung: ${file.name}`
  }
  if (file.size > maxFileSize) {
    const maxMb = Math.round((maxFileSize / 1024 / 1024) * 10) / 10
    return `Ukuran file melebihi ${maxMb} MB: ${file.name}`
  }

  return null
}

export async function uploadFilesToBlob(files: File[], folder: string, policy?: UploadPolicy): Promise<string[]> {
  const token = getBlobToken()
  const uploadedUrls: string[] = []

  for (const file of files) {
    const error = validateUploadFileWithPolicy(file, policy)
    if (error) throw new Error(error)

    const ext = path.extname(file.name) || ".bin"
    const safeName = `${Date.now()}-${randomUUID()}${ext}`
    const key = `${folder}/${safeName}`
    const blob = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
      token,
    })
    uploadedUrls.push(blob.url)
  }

  return uploadedUrls
}
