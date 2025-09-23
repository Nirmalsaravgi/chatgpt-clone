import MemoryClient from "mem0ai"

type SearchParams = { userId: string; query: string; topK?: number; threadId?: string }
type UpsertParams = { userId: string; text: string; threadId?: string; metadata?: Record<string, unknown> }

const MEM0_API_KEY = process.env.MEM0_API_KEY
const MEM0_DEBUG = process.env.MEM0_DEBUG === "1"

let client: MemoryClient | null = null
function getClient(): MemoryClient {
  if (!MEM0_API_KEY) throw new Error("mem0 not configured")
  if (!client) {
    client = new MemoryClient({ apiKey: MEM0_API_KEY })
  }
  return client
}

type MemoryItem = { id: string; text: string; score?: number; metadata?: Record<string, unknown> }

export async function searchMemories(params: SearchParams): Promise<MemoryItem[]> {
  if (!MEM0_API_KEY) return []
  const { userId, query, threadId } = params
  try {
    const c = getClient()
    const filters: { OR: Array<Record<string, unknown>> } = { OR: [{ user_id: userId }] }
    if (threadId) {
      // Scope by metadata only; 'tags' is not an allowed filter key
      filters.OR.push({ metadata: { threadId } })
    }
    const results = await c.search(query, { filters, api_version: "v2" as unknown as string })
    const items = Array.isArray(results) ? results : []
    if (MEM0_DEBUG) console.info("[mem0] sdk search ok", { count: items.length })

    const extractText = (root: any): string => {
      const seen = new Set<any>()
      const keyScore = (k: string) => /content|text|value|summary|memory|note|fact/i.test(k) ? 5 : /title|name/i.test(k) ? 2 : 0
      let best: { score: number; text: string } = { score: -1, text: "" }
      const visit = (obj: any, depth: number) => {
        if (!obj || typeof obj !== 'object' || seen.has(obj) || depth > 5) return
        seen.add(obj)
        if (Array.isArray(obj)) {
          for (const it of obj) visit(it, depth + 1)
          return
        }
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string') {
            const text = v.trim()
            if (text) {
              const score = keyScore(k) + Math.min(4, Math.floor(text.length / 50)) + (text.includes(' ') ? 1 : 0)
              if (score > best.score) best = { score, text }
            }
          } else if (typeof v === 'object' && v) {
            visit(v, depth + 1)
          }
        }
      }
      visit(root, 0)
      return best.text
    }

    const normalized = items.map((m: any) => ({
      id: m?.id || m?._id || "",
      text: extractText(m),
      score: m?.score,
      metadata: m?.metadata,
    }))

    if (MEM0_DEBUG && normalized.length) {
      try {
        const sample = normalized.slice(0, 2).map((x: any) => ({ id: x.id, textPreview: (x.text || '').slice(0, 200) }))
        const rawShape = items.slice(0, 1).map((x: any) => ({ keys: Object.keys(x || {}), raw: JSON.stringify(x).slice(0, 1000) }))
        console.info("[mem0] normalized memories sample", sample)
        console.info("[mem0] raw search item shape", rawShape)
      } catch {}
    }

    return normalized
  } catch (e) {
    if (MEM0_DEBUG) console.warn("[mem0] sdk search failed", { message: (e as any)?.message })
    return []
  }
}

export async function upsertMemory(params: UpsertParams): Promise<{ id?: string } | null> {
  if (!MEM0_API_KEY) return null
  const { userId, text, threadId, metadata } = params
  try {
    const c = getClient()
    const msgs: Array<{ role: "user" | "assistant"; content: string }> = [{ role: "user", content: text }]
    const options: Record<string, unknown> = { user_id: userId }
    if (threadId) options.metadata = { ...(metadata || {}), threadId }
    else if (metadata) options.metadata = metadata
    const res = await c.add(msgs as any, options)
    if (MEM0_DEBUG) console.info("[mem0] sdk add ok", { response: res })
    return { id: (res as any)?.id || (res as any)?._id }
  } catch (e) {
    if (MEM0_DEBUG) console.warn("[mem0] sdk add failed", { message: (e as any)?.message })
    return null
  }
}

export function formatMemoriesForSystemPrompt(memories: Array<{ text: string }>): string {
  if (!memories?.length) return ""
  const bullets = memories
    .map((m) => (m?.text || "").trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((t) => `- ${t}`)
    .join("\n")
  return bullets ? `Relevant user memories:\n${bullets}` : ""
}

