import { NextRequest } from "next/server"
import { streamText, convertToCoreMessages } from "ai"
import { google } from "@ai-sdk/google"
import { resolveModel, getBudgets } from "@/lib/models"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()
    const modelId = resolveModel(model)
    const { reserveForResponse } = getBudgets(modelId)

    const result = await streamText({
      model: google(modelId),
      messages: convertToCoreMessages(messages || []),
      maxTokens: reserveForResponse,
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


