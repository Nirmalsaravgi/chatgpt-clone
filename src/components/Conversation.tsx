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
import { Check } from "lucide-react"

type Message = { id: string; role: "user" | "assistant"; content: string }

type Props = { initialQuery: string }

export function Conversation({ initialQuery }: Props) {
  const [messages, setMessages] = React.useState<Message[]>(() =>
    initialQuery
      ? [
          { id: crypto.randomUUID(), role: "user", content: initialQuery },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Hey! 😊\nHow can I help you today?",
          },
        ]
      : []
  )
  const [text, setText] = React.useState("")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const submit = () => {
    const q = text.trim()
    if (!q) return
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: q }])
    setText("")
  }

  return (
    <div className="w-full min-h-dvh flex flex-col">
      <div className="flex-1 w-full">
        <div className="text-base my-auto mx-auto pb-10 [--thread-content-margin:--spacing(4)] md:[--thread-content-margin:--spacing(6)] lg:[--thread-content-margin:--spacing(16)] px-[var(--thread-content-margin)]">
          <div className="[--thread-content-max-width:40rem] lg:[--thread-content-max-width:48rem] mx-auto max-w-[var(--thread-content-max-width)] flex-1 relative flex w-full min-w-0 flex-col">
          <div className="flex flex-col text-sm">
            {messages.map((m) => (
              <div key={m.id} className="w-full">
                {m.role === "user" ? (
                  <div className="flex w-full items-end justify-end">
                    <div className="user-message-bubble-color relative rounded-[18px] px-4 py-1.5 data-[multiline]:py-3 max-w-[min(70%,680px)] bg-[var(--bg-elevated-primary)] text-foreground">
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full items-start justify-start">
                    <div className="w-full">
                      <div className="markdown prose dark:prose-invert w-full break-words">
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                      <div className="flex min-h-[46px] justify-start">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="text-foreground/60 hover:bg-[var(--bg-secondary)] rounded-lg"
                                aria-label="Copy"
                                onClick={() => {
                                  navigator.clipboard.writeText(m.content)
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
            <div className="-my-2.5 flex min-h-14 items-center overflow-x-hidden px-1.5 [grid-area:primary]">
              <Textarea
                placeholder="Ask anything"
                className="flex-1 bg-transparent dark:bg-transparent shadow-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 placeholder:text-foreground/50 text-[16px] leading-[24px] resize-none p-0 min-h-[56px] h-[56px]"
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
              />
            </div>

            <div className="-m-1 max-w-full overflow-x-auto p-1 [grid-area:footer] [scrollbar-width:none]">
              <div className="flex min-w-fit items-center gap-1.5 ps-0 pe-1.5 w-full">
                <Button variant="outline" className="h-9 rounded-full px-3 text-[13px] font-semibold">
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


