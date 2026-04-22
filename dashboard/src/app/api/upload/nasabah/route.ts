import { auth } from "@/lib/auth"
import { uploadFilesToBlob } from "@/lib/blob-upload"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const files = formData.getAll("files").filter((v): v is File => v instanceof File)

  if (files.length === 0) {
    return Response.json({ error: "Tidak ada file yang diupload." }, { status: 400 })
  }

  try {
    const uploadedUrls = await uploadFilesToBlob(files, "uploads/nasabah")
    return Response.json({ urls: uploadedUrls })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload dokumen gagal."
    return Response.json({ error: message }, { status: 400 })
  }
}
