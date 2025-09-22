import { NextRequest } from "next/server"
import { streamText, convertToModelMessages } from "ai"
import { google } from "@ai-sdk/google"
import { resolveModel, getBudgets } from "@/lib/models"
import { encode } from "gpt-tokenizer"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { messages, model, attachments } = await req.json()
    const modelId = resolveModel(model)
    const { reserveForResponse } = getBudgets(modelId)

    // Trim to context window using accurate token counts on UI messages
    const uiMessages: any[] = Array.isArray(messages) ? messages : []
    const getText = (m: any): string => {
      if (typeof m?.content === "string") return m.content as string
      const parts = Array.isArray(m?.parts) ? m.parts : []
      return parts.map((p: any) => (typeof p === "string" ? p : p?.text ?? "")).join("")
    }
    const countTokens = (t: string) => {
      try { return encode(t).length } catch { return Math.ceil((t || "").length / 4) }
    }
    const budget = Math.max(0, (getBudgets(modelId).maxInputTokens ?? 128000) - reserveForResponse)
    const kept: any[] = []
    let total = 0
    for (let i = uiMessages.length - 1; i >= 0; i--) {
      const m = uiMessages[i]
      const cost = countTokens(getText(m)) + 8
      if (total + cost > budget) break
      kept.unshift(m)
      total += cost
    }

    // NOTE: do not append attachments as plain text; we will add proper image parts below

    // Build Core messages with proper image parts for attachments
    const uiMessagesForConversion = kept.map((m, idx) => {
      const isLast = idx === kept.length - 1
      const text = getText(m)
      const parts: any[] = []
      if (text) parts.push({ type: "text", text })
      if (isLast && attachments && Array.isArray(attachments) && attachments.length) {
        for (const f of attachments) {
          const mime = (f as any)?.mime || (f as any)?.mimeType
          if (typeof f?.url === "string" && typeof mime === "string" && mime.startsWith("image/")) {
            parts.push({ type: "image", image: { url: f.url } })
          } else if (typeof f?.url === "string") {
            parts.push({ type: "text", text: `${f.name || 'file'}: ${f.url}` })
          }
        }
      }
      return { role: m.role, parts: parts.length ? parts : [{ type: "text", text: "" }] }
    })

    const result = await streamText({
      model: google(modelId),
      messages: convertToModelMessages(uiMessagesForConversion as any),
      maxOutputTokens: reserveForResponse,
    })

    // Support multiple SDK versions: prefer data stream, then AI stream, then plain text
    const anyResult: any = result as any
    if (typeof anyResult?.toDataStreamResponse === "function") {
      return anyResult.toDataStreamResponse()
    }
    if (typeof anyResult?.toAIStreamResponse === "function") {
      return anyResult.toAIStreamResponse()
    }
    return anyResult.toTextStreamResponse()
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}


