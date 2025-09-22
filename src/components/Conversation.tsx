"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { GptAttachIcon } from "@/components/icons/GptAttachIcon"
import { GptSearchIcon } from "@/components/icons/GptSearchIcon"
import { GptStudyIcon } from "@/components/icons/GptStudyIcon"
import { GptVoiceIcon } from "@/components/icons/GptVoiceIcon"
import { GptCopyIcon } from "@/components/icons/GptCopyIcon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Check, ArrowUp } from "lucide-react"
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
  const { messages, sendMessage, stop, status } = useChat({
    transport: new TextStreamChatTransport({ api: "/api/chat" }),
    onResponse: (response: Response) => {
      const newThreadId = response.headers.get("x-thread-id")
      if (newThreadId && !threadId) {
        router.replace(`/chat/${newThreadId}`)
      }
    },
  } as unknown as Parameters<typeof useChat>[0])

  const formRef = React.useRef<HTMLFormElement>(null)
  const [text, setText] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = React.useState<Array<{ file: File; preview: string }>>([])

  const didSubmitInitialRef = React.useRef(false)
  React.useEffect(() => {
    if (initialQuery && !didSubmitInitialRef.current) {
      didSubmitInitialRef.current = true
      // If there's no active thread, create it first and navigate so the chat happens on /chat/[threadId]
      const run = async () => {
        if (!threadId) {
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
        setText("")
      }
      run().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, threadId])

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

  const submit = () => {
    if (!text.trim()) return
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
      const finalText = text + attachmentLines

      // If not in a thread yet, create a thread first and navigate, carrying the query
      if (!threadId) {
        const res = await fetch('/api/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: finalText.slice(0, 60) })
        })
        if (res.ok) {
          const data = await res.json()
          const newId = (data.threadId || data._id || '').toString()
          setText("")
          pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
          setPendingFiles([])
          router.push(`/chat/${newId}?q=${encodeURIComponent(finalText)}`)
          return
        }
      }

      const body: any = { attachments: uploaded, model, temporaryChat }
      if (threadId) body.threadId = threadId
      await sendMessage({ text: finalText }, { body })
      setText("")
      // revoke previews and clear staged files
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
      setPendingFiles([])
    }
    doSend().catch(() => {})
  }

  return (
    <div className="w-full min-h-dvh flex flex-col">
      <div className="flex-1 w-full">
        <div className="text-base my-auto mx-auto pb-10 [--thread-content-margin:--spacing(4)] md:[--thread-content-margin:--spacing(6)] lg:[--thread-content-margin:--spacing(16)] px-[var(--thread-content-margin)]">
          <div className="[--thread-content-max-width:40rem] lg:[--thread-content-max-width:48rem] mx-auto max-w-[var(--thread-content-max-width)] flex-1 relative flex w-full min-w-0 flex-col">
          <div className="flex flex-col text-sm">
            {[...preloaded, ...messages].map((m: any) => (
              <div key={m.id} className="w-full">
                {m.role === "user" ? (
                  <div className="flex w-full items-end justify-end">
                    <div className="user-message-bubble-color relative rounded-[18px] px-4 py-1.5 data-[multiline]:py-3 max-w-[min(70%,680px)] bg-[var(--bg-elevated-primary)] text-foreground">
                      <div className="markdown w-full break-words">
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
                ) : (
                  <div className="flex w-full items-start justify-start">
                    <div className="w-full">
                      <div className="markdown w-full break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            a: (props) => (
                              <a {...props} target="_blank" rel="noreferrer" />
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
                )}
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 inset-x-0 z-20 pb-2 pt-2 bg-[var(--bg-primary,transparent)]/60 backdrop-blur-[2px]">
        <div className="my-auto mx-auto [--thread-content-margin:--spacing(4)] md:[--thread-content-margin:--spacing(6)] lg:[--thread-content-margin:--spacing(16)] px-[var(--thread-content-margin)] [--thread-content-max-width:40rem] lg:[--thread-content-max-width:48rem] max-w-[var(--thread-content-max-width)]">
          <div className="group/composer bg-[var(--bg-secondary)] text-secondary-foreground p-2.5 grid grid-cols-[auto_1fr_auto] [grid-template-areas:'header_header_header'_'leading_primary_trailing'_'._footer_.'] rounded-[28px] shadow-sm border border-border overflow-clip bg-clip-padding">
            <div
              className="-my-2.5 flex min-h-14 items-center overflow-x-hidden px-1.5 [grid-area:primary] relative"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy" }}
              onDrop={(e) => {
                e.preventDefault()
                const files = Array.from(e.dataTransfer.files || [])
                if (!files.length) return
                const staged = files.map(file => ({ file, preview: URL.createObjectURL(file) }))
                setPendingFiles(prev => [...prev, ...staged])
              }}
            >
              <form
                ref={formRef}
                onSubmit={(e) => {
                  e.preventDefault()
                  submit()
                }}
                className="flex-1"
              >
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
              <Textarea
                placeholder="Ask anything"
                className="flex-1 bg-transparent dark:bg-transparent shadow-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 placeholder:text-foreground/50 text-[16px] leading-[24px] resize-none p-0 min-h-[56px] h-[56px]"
                rows={1}
                name="input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={(e) => {
                  const items = Array.from(e.clipboardData?.items || [])
                  const files = items
                    .filter(i => i.kind === "file")
                    .map(i => i.getAsFile())
                    .filter((f): f is File => !!f)
                  if (files.length) {
                    const staged = files.map(file => ({ file, preview: URL.createObjectURL(file) }))
                    setPendingFiles(prev => [...prev, ...staged])
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!text.trim() || status === "streaming"}
                className="absolute right-1.5 bottom-1.5 inline-flex items-center justify-center size-8 rounded-full bg-white text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUp className="size-4" />
              </button>
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
              </form>
            </div>

            <div className="-m-1 max-w-full overflow-x-auto p-1 [grid-area:footer] [scrollbar-width:none]">
              <div className="flex min-w-fit items-center gap-1.5 ps-0 pe-1.5 w-full">
                <Button variant="outline" className="h-9 rounded-full px-3 text-[13px] font-semibold" onClick={() => fileInputRef.current?.click()}>
                  <GptAttachIcon className="size-4 mr-1" /> Attach
                </Button>
                <Button variant="outline" className="h-9 rounded-full px-3 text-[13px] font-medium">
                  <GptSearchIcon className="size-4 mr-1" /> Search
                </Button>
                <Button variant="outline" className="h-9 rounded-full px-3 text-[13px] font-medium">
                  <GptStudyIcon className="size-4 mr-1" /> Study
                </Button>
                <div className="ms-auto flex items-center gap-1.5">
                  <Button type="button" aria-label="Start voice mode" variant="ghost" className="relative flex h-9 items-center justify-center rounded-full min-w-8 p-2 text-[var(--text-secondary)] hover:opacity-80">
                    <div className="flex items-center justify-center">
                      <GptVoiceIcon className="size-5" />
                    </div>
                    <span className="ps-1 pe-1 text-[13px] font-semibold">Voice</span>
                  </Button>
                </div>
              </div>
            </div>
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


