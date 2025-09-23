import { NextRequest } from "next/server"
import { streamText, convertToModelMessages } from "ai"
import { google } from "@ai-sdk/google"
import { resolveModel, getBudgets } from "@/lib/models"
import { encode } from "gpt-tokenizer"
import { auth } from "@clerk/nextjs/server"
import { searchMemories, upsertMemory, formatMemoriesForSystemPrompt } from "@/lib/memory"
import { getCollections } from "@/lib/db"
import { ObjectId } from "mongodb"

export const runtime = "nodejs"

let hasLoggedPromptPreview = false

export async function POST(req: NextRequest) {
  try {
    const { messages, model, attachments, temporaryChat, threadId: inputThreadId } = await req.json()
    const { userId } = await auth()
    // Choose a vision-capable model automatically if images are present
    const requestedModelId = resolveModel(model)
    const hasImageAttachment = Array.isArray(attachments) && attachments.some((f: any) => {
      const mime = (f?.mime || f?.mimeType || '') as string
      const dataUrl: string | undefined = f?.dataUrl
      return (typeof mime === 'string' && mime.startsWith('image/')) || (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/'))
    })
    const modelId = (hasImageAttachment && requestedModelId === 'models/gemini-2.5-flash-lite')
      ? 'models/gemini-2.5-flash'
      : requestedModelId
    const { reserveForResponse } = getBudgets(modelId)
    if (process.env.MEM0_DEBUG === '1' || process.env.IMG_DEBUG === '1') {
      try { console.info('[img] chosen model', { modelId, requestedModelId, hasImageAttachment }) } catch {}
    }

    // Build source messages: optionally augment with prior DB context for the thread
    const uiMessages: any[] = Array.isArray(messages) ? messages : []
    let uiSource: any[] = uiMessages
    try {
      if (userId && typeof inputThreadId === 'string' && inputThreadId && uiMessages.length <= 1) {
        const { messages: messagesCol } = await getCollections()
        const prior = await messagesCol
          .find({ threadId: new ObjectId(inputThreadId) })
          .sort({ createdAt: 1 })
          .toArray()
        const mapped = prior.map((doc: any) => ({
          role: doc?.role,
          parts: Array.isArray(doc?.parts) && doc.parts.length ? doc.parts : (typeof doc?.content === 'string' && doc.content ? [{ type: 'text', text: String(doc.content) }] : []),
        }))
        uiSource = [...mapped, ...uiMessages]
      }
    } catch {}
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
    for (let i = uiSource.length - 1; i >= 0; i--) {
      const m = uiSource[i]
      const cost = countTokens(getText(m)) + 8
      if (total + cost > budget) break
      kept.unshift(m)
      total += cost
    }

    // NOTE: do not append attachments as plain text; we will add proper image parts below

    // Prepare base64 image parts for the last turn if images were attached
    const IMG_DEBUG = process.env.MEM0_DEBUG === '1' || process.env.IMG_DEBUG === '1'
    if (IMG_DEBUG) {
      try {
        const attDbg = Array.isArray(attachments) ? attachments.map((a: any) => ({ url: a?.url, mime: a?.mime || a?.mimeType, name: a?.name })) : []
        console.info('[img] attachments received', { count: attDbg.length, attachments: attDbg })
      } catch {}
    }
    function normalizeUploadcareUrl(u: string): string[] {
      const variants: string[] = []
      try {
        const m = u.match(/^https?:\/\/ucarecdn\.com\/([a-f0-9\-]{36}|[a-f0-9]{32})/i)
        if (m) {
          const uuid = m[1]
          variants.push(`https://ucarecdn.com/${uuid}/`)
          variants.push(`https://ucarecdn.com/${uuid}/-/preview/`)
          variants.push(`https://ucarecdn.com/${uuid}/-/format/auto/`)
        }
      } catch {}
      // Always include original last
      variants.push(u)
      return Array.from(new Set(variants))
    }

    async function urlToDataUrl(url: string, mime?: string): Promise<string | null> {
      const candidates = /ucarecdn\.com/i.test(url) ? normalizeUploadcareUrl(url) : [url]
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate)
          if (!res.ok) {
            if (IMG_DEBUG) console.info('[img] fetch not ok', { url: candidate, status: res.status })
            continue
          }
          const ct = res.headers.get('content-type') || mime || 'image/png'
          if (IMG_DEBUG) console.info('[img] fetch ok', { url: candidate, contentType: ct })
          const buf = await res.arrayBuffer()
          const bin = Buffer.from(buf).toString('base64')
          return `data:${ct};base64,${bin}`
        } catch (e: any) {
          if (IMG_DEBUG) console.info('[img] fetch error', { url: candidate, message: e?.message })
        }
      }
      return null
    }
    let imagePartsForLastMessage: any[] = []
    if (attachments && Array.isArray(attachments) && attachments.length) {
      try {
        const imgAtts = attachments.filter((f: any) => typeof ((f?.mime || f?.mimeType)) === 'string' && (f?.mime || f?.mimeType).startsWith('image/'))
        if (imgAtts.length) {
          const dataUrls = await Promise.all(
            imgAtts.map(async (f: any) => {
              if (typeof f?.dataUrl === 'string' && f.dataUrl.startsWith('data:image/')) return f.dataUrl
              if (typeof f?.url === 'string') return await urlToDataUrl(f.url, (f?.mime || f?.mimeType))
              return null
            })
          )
          imagePartsForLastMessage = dataUrls
            .filter(Boolean)
            .map((dataUrl) => ({ type: 'image', image: dataUrl as string }))
          if (IMG_DEBUG) {
            try {
              console.info('[img] conversion result', { requested: imgAtts.length, converted: imagePartsForLastMessage.length })
            } catch {}
          }
        }
      } catch {}
    }

    // Build UI messages with proper parts and optional memory system prompt
    const uiMessagesCore = kept.map((m, idx) => {
      const isLast = idx === kept.length - 1
      const text = getText(m)
      const parts: any[] = []
      if (text) parts.push({ type: "text", text })
      if (isLast && imagePartsForLastMessage.length) {
        parts.push(...imagePartsForLastMessage)
      } else if (isLast && attachments && Array.isArray(attachments) && attachments.length) {
        // Non-image files: include as short text references
        for (const f of attachments) {
          const mime = (f as any)?.mime || (f as any)?.mimeType
          if (typeof f?.url === 'string' && !(typeof mime === 'string' && mime.startsWith('image/'))) {
            parts.push({ type: 'text', text: `${f.name || 'file'}: ${f.url}` })
          }
        }
      }
      if (IMG_DEBUG && isLast) {
        try {
          console.info('[img] last user parts', parts.map((p: any) => p?.type))
        } catch {}
      }
      return { role: m.role, parts: parts.length ? parts : [{ type: "text", text: "" }] }
    })

    // Retrieve relevant memories and prepend as system message
    let uiMessagesForConversion: any[] = []
    let systemInstruction: string = ""
    try {
      if (!temporaryChat && userId) {
        // extract last user text from kept
        let lastUserText = ""
        for (let i = kept.length - 1; i >= 0; i--) {
          const m = kept[i]
          if (m?.role === "user") { lastUserText = getText(m); break }
        }
        // prefer DB threadId passed from client
        const threadId: string | undefined = typeof inputThreadId === "string" ? inputThreadId : undefined
        if (lastUserText) {
          // HYBRID MEMORY: merge thread-scoped and global memories
          const [threadMems, globalMems] = await Promise.all([
            searchMemories({ userId, query: lastUserText, topK: 5, threadId }),
            searchMemories({ userId, query: lastUserText, topK: 5 }),
          ])
          const merged = [...threadMems, ...globalMems]
          // de-duplicate by text
          const seen = new Set<string>()
          const unique = merged.filter(m => {
            const key = (m.text || "").trim().toLowerCase()
            if (!key || seen.has(key)) return false
            seen.add(key)
            return true
          })
          const systemMemory = formatMemoriesForSystemPrompt(unique)
          if (systemMemory) {
            // Strong directive to ensure the model applies the memories when relevant
            systemInstruction = `Use the following user-specific facts if relevant to answer. If asked about the user's preferences or profile, answer using these facts instead of saying you don't know.\n${systemMemory}`

            // 2) Additionally prepend the memory context into the last user message text
            //    to ensure providers that de-emphasize 'system' still see the context.
            try {
              for (let i = uiMessagesCore.length - 1; i >= 0; i--) {
                const msg: any = uiMessagesCore[i]
                if (msg?.role === 'user' && Array.isArray(msg.parts)) {
                  // Find first text part if any
                  let textPartIdx = -1
                  for (let pIdx = 0; pIdx < msg.parts.length; pIdx++) {
                    const p = msg.parts[pIdx]
                    if (p && typeof p === 'object' && p.type === 'text') { textPartIdx = pIdx; break }
                  }
                  if (textPartIdx >= 0) {
                    const current = (msg.parts[textPartIdx]?.text || '') as string
                    msg.parts[textPartIdx] = { type: 'text', text: `${systemMemory}\n\n${current}` }
                  } else {
                    msg.parts.unshift({ type: 'text', text: systemMemory })
                  }
                  break
                }
              }
            } catch {}
          }
          // fire-and-forget upsert of user text
          // write to both thread and global (preference-style persistence across chats)
          Promise.all([
            upsertMemory({ userId, text: lastUserText, threadId }),
            upsertMemory({ userId, text: lastUserText }),
          ]).catch(() => {})
        }
      }
    } catch {}
    uiMessagesForConversion.push(...uiMessagesCore)
    if (IMG_DEBUG) {
      try {
        // Log the final last user message part details
        let lastUser: any = null
        for (let i = uiMessagesForConversion.length - 1; i >= 0; i--) {
          const msg: any = uiMessagesForConversion[i]
          if (msg?.role === 'user') { lastUser = msg; break }
        }
        if (lastUser && Array.isArray(lastUser.parts)) {
          const details = lastUser.parts.map((p: any) => {
            if (p?.type === 'text') return { type: 'text', chars: String(p?.text || '').length }
            if (p?.type === 'image') {
              const img = p?.image
              const u = typeof img === 'string' ? img : (img?.url || '')
              const isData = typeof u === 'string' && u.startsWith('data:')
              const shape = typeof img === 'string' ? 'string' : (img && typeof img === 'object' ? 'object' : typeof img)
              return { type: 'image', isDataUrl: isData, shape, preview: typeof u === 'string' ? u.slice(0, 32) : typeof u }
            }
            return { type: p?.type || typeof p }
          })
          console.info('[img] final last user parts detail', details)
        }
      } catch {}
    }

    // Persist user message if threadId provided and user is authenticated
    // If no threadId and userId, create a new thread automatically
    let effectiveThreadId: string | undefined = typeof inputThreadId === 'string' && inputThreadId ? inputThreadId : undefined
    try {
      if (userId && !effectiveThreadId) {
        const { threads } = await getCollections()
        const now = new Date()
        // derive a tentative title from first user message content
        let firstUserText = ''
        for (let i = 0; i < uiSource.length; i++) {
          const m = uiSource[i]
          if (m?.role === 'user') { firstUserText = getText(m); break }
        }
        const title = (firstUserText || 'New chat').slice(0, 60)
        const result = await threads.insertOne({ userId, title, createdAt: now, updatedAt: now, lastMessageAt: now })
        effectiveThreadId = result.insertedId.toString()
      }
    } catch {}

    try {
      if (userId && typeof effectiveThreadId === "string" && effectiveThreadId) {
        const { threads, messages: messagesCol } = await getCollections()
        const threadObjectId = new ObjectId(effectiveThreadId)
        const thread = await threads.findOne({ _id: threadObjectId, userId })
        if (thread) {
          // find last user text
          let lastUserText = ""
          for (let i = kept.length - 1; i >= 0; i--) {
            const m = kept[i]
            if (m?.role === "user") { lastUserText = getText(m); break }
          }
          const parts: any[] = []
          if (lastUserText) parts.push({ type: 'text', text: lastUserText })
          // Persist images as URLs to keep DB light; model receives base64 above
          if (attachments && Array.isArray(attachments) && attachments.length) {
            for (const f of attachments) {
              const mime = (f as any)?.mime || (f as any)?.mimeType
              if (typeof f?.url === 'string' && typeof mime === 'string' && mime.startsWith('image/')) {
                parts.push({ type: 'image', image: { url: f.url } })
              }
            }
          }
          const now = new Date()
          await messagesCol.insertOne({
            threadId: threadObjectId,
            userId,
            role: 'user',
            parts,
            attachments: Array.isArray(attachments) ? attachments : [],
            createdAt: now,
          })
          const titleUpdate = lastUserText ? { title: lastUserText.slice(0, 60) } : {}
          await threads.updateOne({ _id: threadObjectId }, { $set: { updatedAt: now, lastMessageAt: now, ...titleUpdate } })
        }
      }
    } catch {}

    if (!hasLoggedPromptPreview && process.env.MEM0_DEBUG === '1') {
      try {
        const preview = (uiMessagesForConversion as any[]).map((m: any) => {
          if (typeof m?.content === 'string') {
            return { role: m.role, content: [{ type: 'text', text: String(m.content).slice(0, 1000) }] }
          }
          const parts = Array.isArray(m?.parts) ? m.parts : []
          const content = parts.map((p: any) => p?.type === 'text'
            ? { type: 'text', text: String(p?.text ?? '').slice(0, 1000) }
            : p)
          return { role: m.role, content }
        })
        console.info('[debug] modelMessages preview', {
          systemInstruction: String(systemInstruction || '').slice(0, 2000),
          messages: preview,
        })
      } catch {}
      hasLoggedPromptPreview = true
    }

    const modelMessages = convertToModelMessages(uiMessagesForConversion as any)
    try {
      if (imagePartsForLastMessage.length) {
        for (let i = modelMessages.length - 1; i >= 0; i--) {
          const msg: any = modelMessages[i]
          if (msg?.role === 'user') {
            if (!Array.isArray(msg.content)) msg.content = []
            for (const p of imagePartsForLastMessage) {
              const img = typeof p?.image === 'string' ? p.image : (p?.image?.url || '')
              if (img) msg.content.push({ type: 'image', image: img })
            }
            break
          }
        }
      }
    } catch {}
    if (IMG_DEBUG) {
      try {
        let lastUser: any = null
        for (let i = modelMessages.length - 1; i >= 0; i--) {
          const msg: any = modelMessages[i]
          if (msg?.role === 'user') { lastUser = msg; break }
        }
        if (lastUser && Array.isArray(lastUser?.content)) {
          const details = lastUser.content.map((p: any) => {
            if (p?.type === 'text') return { type: 'text', chars: String(p?.text || '').length }
            if (p?.type === 'image') {
              const img = p?.image
              const u = typeof img === 'string' ? img : (img?.url || '')
              const isData = typeof u === 'string' && u.startsWith('data:')
              return { type: 'image', isDataUrl: isData, preview: typeof u === 'string' ? u.slice(0, 32) : typeof u }
            }
            return { type: p?.type || typeof p }
          })
          console.info('[img] post-convert message detail', details)
        }
      } catch {}
    }

    const result = await streamText({
      model: google(modelId),
      system: systemInstruction || undefined,
      messages: modelMessages as any,
      maxOutputTokens: reserveForResponse,
    })

    // Build a tee stream to persist assistant message after completion
    const anyResult: any = result as any
    if (anyResult?.textStream && typeof anyResult.textStream.getReader === 'function') {
      const encoder = new TextEncoder()
      const reader = anyResult.textStream.getReader()
      let acc = ""
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          function pump() {
            reader.read().then(async ({ value, done }: any) => {
              if (done) {
                // persist assistant message when stream ends
                try {
                  if (userId && typeof effectiveThreadId === 'string' && effectiveThreadId && acc.trim()) {
                    const { threads, messages: messagesCol } = await getCollections()
                    const threadObjectId = new ObjectId(effectiveThreadId)
                    const thread = await threads.findOne({ _id: threadObjectId, userId })
                    if (thread) {
                      const now = new Date()
                      await messagesCol.insertOne({
                        threadId: threadObjectId,
                        userId,
                        role: 'assistant',
                        parts: [{ type: 'text', text: acc }],
                        createdAt: now,
                      })
                      await threads.updateOne({ _id: threadObjectId }, { $set: { updatedAt: now, lastMessageAt: now } })
                    }
                  }
                } catch {}
                controller.close()
                return
              }
              if (typeof value === 'string') {
                acc += value
                controller.enqueue(encoder.encode(value))
              } else if (value) {
                controller.enqueue(value)
              }
              pump()
            }).catch((e: any) => controller.error(e))
          }
          pump()
        },
      })
      return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'x-thread-id': effectiveThreadId || '' } })
    }
    // Fallbacks
    if (typeof anyResult?.toAIStreamResponse === "function") {
      return anyResult.toAIStreamResponse()
    }
    if (typeof anyResult?.toTextStreamResponse === "function") {
      const resp = anyResult.toTextStreamResponse()
      // @ts-ignore attach header when possible
      resp.headers?.set?.('x-thread-id', effectiveThreadId || '')
      return resp
    }
    return new Response("", { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'x-thread-id': effectiveThreadId || '' } })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}


