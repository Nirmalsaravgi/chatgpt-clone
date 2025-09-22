import { UploadedFile } from "@/types/uploads"

const UPLOADCARE_BASE = "https://upload.uploadcare.com/base/"

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

export async function uploadViaUploadcare(form: FormData): Promise<UploadedFile[]> {
  const publicKey = requireEnv("UPLOADCARE_PUBLIC_KEY")

  const files = form.getAll("files[]").filter((f): f is File => f instanceof File)
  const results: UploadedFile[] = []

  for (const file of files) {
    const upForm = new FormData()
    upForm.append("UPLOADCARE_PUB_KEY", publicKey)
    upForm.append("UPLOADCARE_STORE", "auto")
    upForm.append("file", file)

    const resp = await fetch(UPLOADCARE_BASE, { method: "POST", body: upForm })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Uploadcare error: ${resp.status} ${text}`)
    }
    const json = await resp.json() as { file: string }
    const uuid = json.file
    const cdnUrl = `https://ucarecdn.com/${uuid}/-/` // base; transformations can be appended later

    const mime = file.type || "application/octet-stream"

    results.push({
      url: cdnUrl,
      name: file.name,
      mime,
      size: file.size,
    })
  }

  return results
}


