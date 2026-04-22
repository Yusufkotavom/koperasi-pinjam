import { auth } from "@/lib/auth"
import { uploadFilesToBlob } from "@/lib/blob-upload"

const LOGO_MAX_FILE_SIZE = 600 * 1024 // 600KB
const LOGO_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
])

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const files = formData.getAll("files").filter((v): v is File => v instanceof File)
  const file = files[0]

  if (!file) {
    return Response.json({ error: "Tidak ada file logo yang diupload." }, { status: 400 })
  }

  try {
    const uploadedUrls = await uploadFilesToBlob([file], "uploads/logo", {
      maxFileSize: LOGO_MAX_FILE_SIZE,
      allowedTypes: LOGO_ALLOWED_TYPES,
    })
    return Response.json({ urls: uploadedUrls })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload logo gagal."
    return Response.json({ error: message }, { status: 400 })
  }
}
