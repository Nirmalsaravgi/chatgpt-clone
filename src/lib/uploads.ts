import { UploadedFile } from "@/types/uploads"

const UPLOADCARE_BASE = "https://upload.uploadcare.com/base/"

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

export async function uploadViaUploadcare(form: FormData): Promise<UploadedFile[]> {
  const publicKey = requireEnv("UPLOADCARE_PUBLIC_KEY")
  const UPLOAD_DEBUG = process.env.UPLOAD_DEBUG === "1"
  const CUSTOM_CDN = process.env.UPLOADCARE_CDN_BASE || ""

  const files = form.getAll("files[]").filter((f): f is File => f instanceof File)
  const results: UploadedFile[] = []

  for (const file of files) {
    const upForm = new FormData()
    upForm.append("UPLOADCARE_PUB_KEY", publicKey)
    // Force storing on CDN immediately to avoid 404s on ucarecdn.com URLs
    upForm.append("UPLOADCARE_STORE", "1")
    upForm.append("file", file)

    const resp = await fetch(UPLOADCARE_BASE, { method: "POST", body: upForm })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Uploadcare error: ${resp.status} ${text}`)
    }
    const json = await resp.json() as { file: string }
    const uuid = json.file
    // Prefer a filename-bearing URL which is more reliably resolvable on CDN
    // Prefer custom CDN base if provided by project (e.g., tenant subdomain seen in dashboard)
    const rawName = file.name || 'file'
    const filename = encodeURIComponent(rawName)
    const baseDefault = `https://ucarecdn.com/${uuid}`
    const base = CUSTOM_CDN ? `${CUSTOM_CDN.replace(/\/?$/,'')}/${uuid}` : baseDefault
    let cdnUrl = `${base}/${filename}`

    // Try to resolve a working variant URL to avoid 404s caused by propagation
    try {
      const isImage = (file.type || '').startsWith('image/')
      const candidates: string[] = []
      // First, direct filename URL
      candidates.push(`${base}/${filename}`)
      if (isImage) {
        candidates.push(`${base}/-/preview/`)
        candidates.push(`${base}/-/format/auto/`)
      }
      // Inline and raw fallbacks
      candidates.push(`${base}/-/inline/${filename}/`)
      candidates.push(`${base}/-/raw/`)
      candidates.push(`${base}/`)
      for (const u of candidates) {
        try {
          const r = await fetch(u, { method: 'GET' })
          if (r.ok) { cdnUrl = u; break }
        } catch {}
      }
    } catch {}

    if (UPLOAD_DEBUG) {
      try {
        console.info("[upload] uploaded file", { name: file.name, size: file.size, type: file.type, uuid, cdnUrl })
      } catch {}
    }

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


