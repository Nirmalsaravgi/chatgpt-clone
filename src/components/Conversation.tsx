"use client"
import * as React from "react"
import { ComposerBar } from "@/components/ComposerBar"
import { GptCopyIcon } from "@/components/icons/GptCopyIcon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Check, Pencil, ThumbsUp, ThumbsDown, Share, RefreshCcw } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { UploadedFile } from "@/types/uploads"

type Part = { type: 'text'; text?: string } | { type: 'image'; image?: { url: string } } | { type: string; [k: string]: unknown }
type PreloadedMessage = { id: string; role: 'user' | 'assistant' | 'system'; parts?: Part[]; content?: string }
type Props = { initialQuery: string; threadId?: string; initialMessages?: PreloadedMessage[] }

export function Conversation({ initialQuery, threadId, initialMessages = [] }: Props) {
  const searchParams = useSearchParams()
  const model = searchParams.get("model")
  const router = useRouter()
  const temporaryChat = searchParams.get("tc") === "1"
  const { isSignedIn } = useAuth()
  const { messages, sendMessage, stop, status } = useChat({
    transport: new TextStreamChatTransport({ api: "/api/chat" }),
    onResponse: (response: Response) => {
      const newThreadId = response.headers.get("x-thread-id")
      if (isSignedIn && newThreadId && !threadId) {
        router.replace(`/chat/${newThreadId}`)
      }
    },
  } as unknown as Parameters<typeof useChat>[0])

  const formRef = React.useRef<HTMLFormElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = React.useState<Array<{ file: File; preview: string }>>([])

  const didSubmitInitialRef = React.useRef(false)
  React.useEffect(() => {
    if (initialQuery && !didSubmitInitialRef.current) {
      didSubmitInitialRef.current = true
      // If there's no active thread, create it first and navigate so the chat happens on /chat/[threadId]
      const run = async () => {
        if (isSignedIn && !threadId) {
          const res = await fetch('/api/threads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: initialQuery.slice(0, 60) })
          })
          if (res.ok) {
            const data = await res.json()
            const newId = (data.threadId || data._id || '').toString()
            router.push(`/chat/${newId}?q=${encodeURIComponent(initialQuery)}`)
            return
          }
        }
        const body: any = { model, temporaryChat }
        if (threadId) body.threadId = threadId
        await sendMessage({ text: initialQuery }, { body })
      }
      run().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, threadId, isSignedIn])

  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [editingOrdinal, setEditingOrdinal] = React.useState<number | null>(null)
  const [editingValue, setEditingValue] = React.useState<string>("")

  const preloaded = React.useMemo(() => {
    return (initialMessages || []).map((m) => ({
      id: m.id,
      role: m.role,
      parts: Array.isArray(m.parts) && m.parts.length ? m.parts : (m.content ? [{ type: 'text', text: m.content }] : []),
    }))
  }, [initialMessages])

  const getMessageText = (m: { content?: string; parts?: Part[] }): string => {
    if (typeof m?.content === "string") return m.content
    const parts = Array.isArray(m?.parts) ? m.parts : []
    return parts
      .map((p) => (typeof (p as any) === "string" ? (p as unknown as string) : (p as any)?.text ?? ""))
      .join("")
  }

  const extractAttachmentImages = (text: string): { images: Array<{ name: string; url: string }>; cleanText: string } => {
    try {
      const lines = (text || "").split(/\r?\n/)
      const images: Array<{ name: string; url: string }> = []
      let inAtt = false
      const kept: string[] = []
      for (const line of lines) {
        if (!inAtt && /^\s*Attachments:\s*$/i.test(line)) { inAtt = true; continue }
        if (inAtt) {
            const m = line.match(/^-\s*\[([^\]]+)\]\(([^\)]+)\)\s*$/)
          if (m) {
            const name = m[1]
              const url = m[2]
            images.push({ name, url })
            continue
          }
          if (!/^\s*-\s/.test(line)) { inAtt = false; kept.push(line) }
          continue
        }
        kept.push(line)
      }
      return { images, cleanText: kept.join("\n").trim() }
    } catch {
      return { images: [], cleanText: text }
    }
  }

  const timeline = React.useMemo(() => [...preloaded, ...messages], [preloaded, messages])

  const { awaitingAssistant, lastUserId } = React.useMemo(() => {
    const normalize = (s: string) => (s || "").trim().replace(/\s+/g, " ").toLowerCase()
    // Find most recent user turn
    let lastUserIdx = -1
    for (let i = timeline.length - 1; i >= 0; i--) {
      if ((timeline[i] as any)?.role === 'user') { lastUserIdx = i; break }
    }
    const lastUser = lastUserIdx >= 0 ? (timeline[lastUserIdx] as any) : null
    const lastUserText = lastUser ? normalize(getMessageText(lastUser)) : ""
    // First assistant after that user
    let firstAssistantAfterUserIdx = -1
    if (lastUserIdx >= 0) {
      for (let i = lastUserIdx + 1; i < timeline.length; i++) {
        if ((timeline[i] as any)?.role === 'assistant') { firstAssistantAfterUserIdx = i; break }
      }
    }
    const firstAssistantText = firstAssistantAfterUserIdx >= 0 ? normalize(getMessageText(timeline[firstAssistantAfterUserIdx] as any)) : ""
    const isEcho = !!firstAssistantText && firstAssistantText === lastUserText

    // Are we waiting for the first non-echo assistant token?
    const awaiting = status === 'submitted' || (status === 'streaming' && (!firstAssistantText || isEcho))

    const uid = lastUser?.id || null
    return { awaitingAssistant: awaiting, lastUserId: uid }
  }, [status, timeline])

  const sendWithText = (input: string) => {
    if (!input.trim()) return
    const doSend = async () => {
      let uploaded: UploadedFile[] = []
      let dataUrls: Array<string | null> = []
      if (pendingFiles.length) {
        // Prepare client-side base64 for images to avoid server fetch issues
        async function fileToDataURL(file: File): Promise<string> {
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result || ''))
            reader.onerror = (e) => reject(e)
            reader.readAsDataURL(file)
          })
        }
        dataUrls = await Promise.all(
          pendingFiles.map(({ file }) => file.type.startsWith('image/')
            ? fileToDataURL(file).catch(() => null)
            : Promise.resolve(null)
          )
        )

        const fd = new FormData()
        pendingFiles.forEach(({ file }) => fd.append("files[]", file))
        const resp = await fetch("/api/uploads", { method: "POST", body: fd })
        if (!resp.ok) throw new Error(await resp.text())
        const json = await resp.json() as { files: UploadedFile[] }
        uploaded = json.files || []
      }

      const attachmentLines = uploaded.length
        ? "\n\nAttachments:\n" + uploaded.map(f => `- [${f.name}](${f.url})`).join("\n")
        : ""
      const finalText = input + attachmentLines

      // If signed in but not in a thread yet, create a thread first and navigate, carrying the query
      if (isSignedIn && !threadId) {
        const res = await fetch('/api/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: finalText.slice(0, 60) })
        })
        if (res.ok) {
          const data = await res.json()
          const newId = (data.threadId || data._id || '').toString()
          pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
          setPendingFiles([])
          router.push(`/chat/${newId}?q=${encodeURIComponent(finalText)}`)
          return
        }
      }

      // Enhance attachments with client-side dataUrl where available (by index)
      const enhanced = uploaded.map((u, idx) => ({
        ...u,
        dataUrl: Array.isArray(dataUrls) && dataUrls[idx] ? dataUrls[idx] : undefined,
      }))

      const body: any = { attachments: enhanced, model, temporaryChat }
      if (threadId) body.threadId = threadId
      await sendMessage({ text: finalText }, { body })
      // revoke previews and clear staged files
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
      setPendingFiles([])
    }
    doSend().catch(() => {})
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {!isSignedIn && <div className="h-[64px] shrink-0" />}
      <div className="flex-1 w-full min-h-0 overflow-y-auto">
        <div className="text-base mx-auto pt-3 pb-10 [--thread-content-margin:--spacing(4)] md:[--thread-content-margin:--spacing(6)] lg:[--thread-content-margin:--spacing(16)] px-[var(--thread-content-margin)]">
          <div className="[--thread-content-max-width:40rem] lg:[--thread-content-max-width:48rem] mx-auto max-w-[var(--thread-content-max-width)] flex-1 relative flex w-full min-w-0 flex-col">
          <div className="flex flex-col text-sm">
            {timeline.map((m: any, idx: number) => (
              <div key={m.id} className="w-full">
                {m.role === "user" ? (
                  (() => {
                    // Compute ordinal of this user message among user turns so far
                    let ordinal = 0
                    for (let i = 0; i <= idx; i++) { if ((timeline[i] as any)?.role === 'user') ordinal++ }
                    const thisOrdinal = ordinal - 1
                    const isEditing = editingOrdinal === thisOrdinal
                    if (isEditing) {
                      return (
                        <div className="flex w-full items-end justify-end">
                          <div className="bg-[var(--bg-tertiary)] rounded-3xl px-3 py-3 max-w-[var(--user-chat-width,70%)] w-full">
                            <div className="m-2 max-h-[25dvh] overflow-auto">
                              <div className="grid">
                                <textarea
                                  className="col-start-1 col-end-2 row-start-1 row-end-2 w-full resize-none overflow-hidden p-0 m-0 border-0 bg-transparent focus:ring-0 focus-visible:ring-0 text-base"
                                  rows={3}
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                />
                                <span className="invisible col-start-1 col-end-2 row-start-1 row-end-2 p-0 break-all whitespace-pre-wrap">
                                  {editingValue + ' '}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pr-2">
                              <button
                                className="h-8 px-4 rounded-full bg-black text-white hover:bg-black/90 transition-transform duration-150 active:scale-95"
                                onClick={() => { setEditingOrdinal(null); setEditingValue("") }}
                              >
                                Cancel
                              </button>
                              <button
                                className="h-8 px-4 rounded-full bg-white text-black border border-border hover:bg-white/90 transition-transform duration-150 active:scale-95"
                                onClick={async () => {
                                  try {
                                    if (!threadId || thisOrdinal < 0 || !editingValue.trim()) { setEditingOrdinal(null); return }
                                    const q = new URLSearchParams(); q.set('limit', '200')
                                    const res = await fetch(`/api/threads/${threadId}/messages?` + q.toString(), { cache: 'no-store' })
                                    if (!res.ok) throw new Error(await res.text())
                                    const json = await res.json()
                                    const items = Array.isArray(json?.items) ? json.items : []
                                    const userItems = items.filter((it: any) => it?.role === 'user')
                                    const target = userItems[thisOrdinal]
                                    const targetId = target?._id
                                    if (!targetId) throw new Error('Message not found')
                                    const editRes = await fetch(`/api/messages/${targetId}/edit-linear`, {
                                      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: editingValue })
                                    })
                                    if (!editRes.ok) throw new Error(await editRes.text())
                                    window.location.href = `/chat/${threadId}?q=${encodeURIComponent(editingValue)}`
                                    return
                                  } catch {}
                                  setEditingOrdinal(null)
                                  setEditingValue("")
                                }}
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <>
                        <div className="group">
                          {(() => {
                            const { images } = extractAttachmentImages(getMessageText(m))
                            if (!images.length) return null
                            return (
                              <div className="flex w-full items-end justify-end mb-1">
                                <div className="max-w-[var(--user-chat-width,70%)] flex flex-wrap gap-2">
                                  {images.map((img, i) => (
                                    <a key={i} href={img.url} target="_blank" rel="noreferrer" className="block">
                                      <img src={img.url} referrerPolicy="no-referrer" alt={img.name} className="h-28 w-28 object-cover rounded-lg border border-border" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                          <div className="flex w-full items-end justify-end">
                            <div className="user-message-bubble-color relative rounded-full px-4 py-1.5 data-[multiline]:py-3 max-w-[var(--user-chat-width,70%)] bg-[var(--bg-elevated-primary)] text-foreground">
                              <div className="markdown w-full break-words whitespace-pre-wrap text-base">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeHighlight]}
                                  components={{ a: (props) => (<a {...props} target="_blank" rel="noreferrer" />) }}
                                >
                                  {extractAttachmentImages(getMessageText(m)).cleanText}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                          <div className="flex w-full items-start justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <TooltipProvider>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className="text-foreground/60 hover:bg-[var(--bg-secondary)] rounded-lg"
                                      aria-label="Copy"
                                      onClick={() => {
                                        navigator.clipboard.writeText(getMessageText(m))
                                        setCopiedId(m.id)
                                        window.setTimeout(() => setCopiedId((prev) => (prev === m.id ? null : prev)), 1500)
                                      }}
                                    >
                                      <span className="flex items-center justify-center h-8 w-8">
                                        {copiedId === m.id ? <Check className="size-4" /> : <GptCopyIcon />}
                                      </span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                                    Copy
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className="text-foreground/60 hover:bg-[var(--bg-secondary)] rounded-lg"
                                      aria-label="Edit Message"
                                      onClick={() => {
                                        let ord = 0; for (let i = 0; i <= idx; i++) { if ((timeline[i] as any)?.role === 'user') ord++ }
                                        setEditingOrdinal(ord - 1)
                                        setEditingValue(getMessageText(m))
                                      }}
                                    >
                                      <span className="flex items-center justify-center h-8 w-8">
                                        <Pencil className="size-4" />
                                      </span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                                    Edit Message
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </div>
                        </div>
                        {awaitingAssistant && lastUserId === m.id && (
                          <div className="flex w-full items-start justify-start mt-2">
                            <span className="inline-block align-middle rounded-full bg-white/95 dot-breathe" style={{ width: 12, height: 12 }} />
                          </div>
                        )}
                      </>
                    )
                  })()
                ) : (
                  (() => {
                    const assistantTxt = getMessageText(m)
                    // previous user text to detect accidental echo placeholders
                    let prevUserTxt = ""
                    for (let i = idx - 1; i >= 0; i--) {
                      const cand: any = timeline[i]
                      if (cand?.role === 'user') { prevUserTxt = getMessageText(cand as any); break }
                    }
                    if (awaitingAssistant && (!assistantTxt?.trim() || assistantTxt.trim() === prevUserTxt.trim())) {
                      return null
                    }
                    return (
                  <div className="flex w-full items-start justify-start">
                    <div className="w-full">
                      <div className="markdown w-full break-words text-base leading-7 text-foreground">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            a: (props) => (
                              <a {...props} target="_blank" rel="noreferrer" />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="list-disc list-outside pl-[26px]" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol className="list-decimal list-outside pl-[26px]" {...props} />
                            ),
                          }}
                        >
                          {getMessageText(m)}
                        </ReactMarkdown>
                      </div>
                      <div className="flex min-h-[46px] justify-start">
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="text-foreground/60 hover:bg-[var(--bg-secondary)] rounded-lg"
                                  aria-label="Copy"
                                  onClick={() => {
                                    navigator.clipboard.writeText(getMessageText(m))
                                    setCopiedId(m.id)
                                    window.setTimeout(() => setCopiedId((prev) => (prev === m.id ? null : prev)), 1500)
                                  }}
                                >
                                  <span className="flex items-center justify-center h-8 w-8 text-white">
                                    {copiedId === m.id ? <Check className="size-4 text-white" /> : <GptCopyIcon />}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                                Copy
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-foreground/60 hover:bg-[var(--bg-secondary)] rounded-lg" aria-label="Good response">
                                  <span className="flex items-center justify-center h-8 w-8 text-white">
                                    <ThumbsUp className="size-4 text-white" />
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                                Good Response
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-foreground/60 hover:bg-[var(--bg-secondary)] rounded-lg" aria-label="Bad response">
                                  <span className="flex items-center justify-center h-8 w-8 text-white">
                                    <ThumbsDown className="size-4 text-white" />
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                                Bad Response
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-foreground/60 hover:bg-[var(--bg-secondary)] rounded-lg" aria-label="Share">
                                  <span className="flex items-center justify-center h-8 w-8 text-white">
                                    <Share className="size-4 text-white" />
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                                Share
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-foreground/60 hover:bg-[var(--bg-secondary)] rounded-lg" aria-label="Try again">
                                  <span className="flex items-center justify-center h-8 w-8 text-white">
                                    <RefreshCcw className="size-4 text-white" />
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                                Try again
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                    )
                  })()
                )}
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 inset-x-0 z-20 pb-2 pt-0 bg-[var(--bg-primary)]">
        <div className="text-base mx-auto [--thread-content-margin:--spacing(4)] md:[--thread-content-margin:--spacing(6)] lg:[--thread-content-margin:--spacing(16)] px-[var(--thread-content-margin)] w-full">
          <div className="[--thread-content-max-width:40rem] lg:[--thread-content-max-width:48rem] mx-auto max-w-[var(--thread-content-max-width)] flex-1">
            {editingOrdinal !== null && (
              <div className="mb-2 rounded-md border border-border bg-[var(--bg-tertiary)] p-2">
                <div className="text-xs mb-1">Editing message</div>
                <textarea
                  className="w-full rounded border border-border bg-[var(--bg-primary)] p-2 text-sm"
                  rows={3}
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-[var(--bg-elevated-primary)]"
                    onClick={async () => {
                      try {
                        if (!threadId || editingOrdinal === null || !editingValue.trim()) { setEditingOrdinal(null); return }
                        // Map ordinal -> server message _id by fetching thread messages
                        const q = new URLSearchParams()
                        q.set('limit', '200')
                        const res = await fetch(`/api/threads/${threadId}/messages?` + q.toString(), { cache: 'no-store' })
                        if (!res.ok) throw new Error(await res.text())
                        const json = await res.json()
                        const items = Array.isArray(json?.items) ? json.items : []
                        const userItems = items.filter((it: any) => it?.role === 'user')
                        const target = userItems[editingOrdinal]
                        const targetId = target?._id
                        if (!targetId) throw new Error('Message not found')
                        const editRes = await fetch(`/api/messages/${targetId}/edit-linear`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: editingValue })
                        })
                        if (!editRes.ok) throw new Error(await editRes.text())
                        // Hard reload to clear client state, then submit edited text via q param flow
                        window.location.href = `/chat/${threadId}?q=${encodeURIComponent(editingValue)}`
                        return
                      } catch {}
                      setEditingOrdinal(null)
                      setEditingValue("")
                    }}
                  >
                    Save & Continue
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-[var(--bg-secondary)]"
                    onClick={() => { setEditingOrdinal(null); setEditingValue("") }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {pendingFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {pendingFiles.map((p, idx) => (
                  <div key={idx} className="group relative rounded-md border border-border bg-[var(--bg-tertiary)] px-2 py-1 flex items-center gap-2">
                    {p.file.type.startsWith("image/") ? (
                      <img src={p.preview} alt={p.file.name} className="h-8 w-8 object-cover rounded" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-[var(--bg-secondary)] inline-flex items-center justify-center text-xs">FILE</div>
                    )}
                    <span className="max-w-[180px] truncate text-xs">{p.file.name}</span>
                    <button type="button" className="text-xs text-foreground/60 hover:text-foreground" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy" }}
              onDrop={(e) => {
                e.preventDefault()
                const files = Array.from(e.dataTransfer.files || [])
                if (!files.length) return
                const staged = files.map(file => ({ file, preview: URL.createObjectURL(file) }))
                setPendingFiles(prev => [...prev, ...staged])
              }}
            >
              <ComposerBar
                iconsOnly
                onSubmit={sendWithText}
                onAttachClick={() => fileInputRef.current?.click()}
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf,.txt,.md,.doc,.docx"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                const staged = files.map(file => ({ file, preview: URL.createObjectURL(file) }))
                setPendingFiles(prev => [...prev, ...staged])
                e.currentTarget.value = ""
              }}
            />
          </div>
          <div className="w-full text-center text-xs text-foreground/60 mt-2 mb-1">
            ChatGPT can make mistakes. Check important info. <button className="underline">See Cookie Preferences.</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Conversation


