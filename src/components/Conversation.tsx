"use client"
import * as React from "react"
import { ComposerBar } from "@/components/ComposerBar"
import { GptCopyIcon } from "@/components/icons/GptCopyIcon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
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
      if (pendingFiles.length) {
        const fd = new FormData()
        pendingFiles.forEach(({ file }) => fd.append("files", file))
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

      const body: any = { attachments: uploaded, model, temporaryChat }
      if (threadId) body.threadId = threadId
      await sendMessage({ text: finalText }, { body })
      // revoke previews and clear staged files
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
      setPendingFiles([])
    }
    doSend().catch(() => {})
  }

  return (
    <div className="w-full min-h-dvh flex flex-col">
      {!isSignedIn && <div className="h-[64px] shrink-0" />}
      <div className="flex-1 w-full">
        <div className="text-base mx-auto pt-3 pb-10 [--thread-content-margin:--spacing(4)] md:[--thread-content-margin:--spacing(6)] lg:[--thread-content-margin:--spacing(16)] px-[var(--thread-content-margin)]">
          <div className="[--thread-content-max-width:40rem] lg:[--thread-content-max-width:48rem] mx-auto max-w-[var(--thread-content-max-width)] flex-1 relative flex w-full min-w-0 flex-col">
          <div className="flex flex-col text-sm">
            {timeline.map((m: any, idx: number) => (
              <div key={m.id} className="w-full">
                {m.role === "user" ? (
                  <>
                    <div className="flex w-full items-end justify-end">
                      <div className="user-message-bubble-color relative rounded-full px-4 py-1.5 data-[multiline]:py-3 max-w-[var(--user-chat-width,70%)] bg-[var(--bg-elevated-primary)] text-foreground">
                        <div className="markdown w-full break-words whitespace-pre-wrap text-base">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{ a: (props) => (<a {...props} target="_blank" rel="noreferrer" />) }}
                          >
                            {getMessageText(m)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                    {awaitingAssistant && lastUserId === m.id && (
                      <div className="flex w-full items-start justify-start mt-2">
                        <span className="inline-block align-middle rounded-full bg-white/95 dot-breathe" style={{ width: 12, height: 12 }} />
                      </div>
                    )}
                  </>
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


