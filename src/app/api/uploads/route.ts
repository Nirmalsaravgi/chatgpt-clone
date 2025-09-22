import { NextRequest } from "next/server"
import { uploadViaUploadcare } from "@/lib/uploads"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const form = await req.formData()

    // Basic limits & type guard (extend as needed)
    const files = form.getAll("files[]").filter((f): f is File => f instanceof File)
    if (!files.length) {
      return new Response(JSON.stringify({ files: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    const maxCount = 10
    if (files.length > maxCount) {
      return new Response(JSON.stringify({ error: `Too many files (max ${maxCount})` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const uploaded = await uploadViaUploadcare(form)
    return new Response(JSON.stringify({ files: uploaded }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = (err as Error)?.message || "Upload failed"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}


