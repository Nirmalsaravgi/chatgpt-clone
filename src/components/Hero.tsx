"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
// import { Mic } from "lucide-react"
import { GptAttachIcon } from "@/components/icons/GptAttachIcon"
import { GptSearchIcon } from "@/components/icons/GptSearchIcon"
import { GptStudyIcon } from "@/components/icons/GptStudyIcon"
import { GptVoiceIcon } from "@/components/icons/GptVoiceIcon"

type Props = { onSubmit?: (q: string) => void }

export function Hero({ onSubmit }: Props) {
  const [text, setText] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const BASE_HEIGHT = 56
  const [maxHeight, setMaxHeight] = React.useState<number>(280)
  const [inputHeight, setInputHeight] = React.useState<number>(BASE_HEIGHT)
  const [isOverflowing, setIsOverflowing] = React.useState(false)

  React.useEffect(() => {
    const compute = () => {
      try {
        const h = Math.max(Math.floor(window.innerHeight * 0.35), 112)
        setMaxHeight(h)
      } catch { setMaxHeight(280) }
    }
    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [])

  const adjustHeight = React.useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    const next = Math.min(Math.max(BASE_HEIGHT, el.scrollHeight), maxHeight)
    setInputHeight(next)
    setIsOverflowing(el.scrollHeight > maxHeight)
    el.style.height = `${next}px`
  }, [maxHeight])

  const submit = () => {
    if (!text.trim()) return
    onSubmit?.(text.trim())
    setText("")
    setInputHeight(BASE_HEIGHT)
    setIsOverflowing(false)
  }
  return (
    <section className="relative basis-auto shrink flex flex-col items-center justify-center min-h-[62svh] sm:min-h-[64svh] w-full px-[16px] md:px-[24px] lg:px-[32px] pt-5 sm:pt-7 pb-3">
      <div className="flex justify-center">
        <div className="mb-7 hidden text-center sm:block">
          <div className="relative inline-flex justify-center text-center text-2xl leading-9 font-semibold">
            <div>
              <div className="grid-cols-1 items-center justify-end">
                <h1 className="mb-4">ChatGPT</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-token-text-primary mt-[var(--screen-optical-compact-offset-amount,0px)] [display:var(--display-hidden-until-loaded,flex)] w-full shrink flex-col items-center justify-center sm:hidden h-full opacity-100">
        <div className="relative inline-flex justify-center text-center text-2xl leading-9 font-semibold">
          <div>
            <div className="grid-cols-1 items-center justify-end">
              <h1 className="mb-4">ChatGPT</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="text-base mx-auto [--thread-content-margin:--spacing(4)] md:[--thread-content-margin:--spacing(6)] lg:[--thread-content-margin:--spacing(16)] px-[var(--thread-content-margin)] w-full">
        <div className="[--thread-content-max-width:40rem] lg:[--thread-content-max-width:48rem] mx-auto max-w-[var(--thread-content-max-width)] flex-1">
        <div
          className="group/composer bg-[var(--bg-secondary)] text-secondary-foreground p-2.5 grid grid-cols-[auto_1fr_auto] [grid-template-areas:'header_header_header'_'leading_primary_trailing'_'._footer_.'] rounded-[28px] shadow-sm border border-border overflow-clip bg-clip-padding"
          style={{ containIntrinsicSize: "auto 56px" }}
        >
          <div className="-my-2.5 flex min-h-14 items-center overflow-x-hidden px-1.5 [grid-area:primary] group-data-expanded/composer:mb-0 group-data-expanded/composer:px-2.5">
            <Textarea
              ref={textareaRef as any}
              placeholder="Ask anything"
              className="flex-1 bg-transparent dark:bg-transparent shadow-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 placeholder:text-foreground/50 text-[16px] leading-[24px] resize-none py-2 px-0 min-h-[56px]"
              rows={1}
              style={{ height: inputHeight, overflowY: isOverflowing ? "auto" : "hidden" }}
              value={text}
              onChange={(e) => { setText(e.target.value); adjustHeight() }}
              onInput={adjustHeight}
              onFocus={adjustHeight}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 [grid-area:trailing] ms-auto"></div>

          <div className="-m-1 max-w-full overflow-x-auto p-1 [grid-area:footer] [scrollbar-width:none]">
            <div className="flex min-w-fit items-center gap-1.5 ps-0 pe-1.5">
              <Button variant="outline" className="h-9 rounded-full px-3 text-[13px] font-semibold border-border bg-[var(--bg-secondary)] hover:bg-[var(--interactive-bg-secondary-hover)] text-foreground">
                <GptAttachIcon className="size-4 mr-1" /> Attach
              </Button>
              <Button variant="outline" className="h-9 rounded-full px-3 text-[13px] font-medium border-border bg-[var(--bg-secondary)] hover:bg-[var(--interactive-bg-secondary-hover)] text-foreground">
                <GptSearchIcon className="size-4 mr-1" /> Search
              </Button>
              <Button variant="outline" className="h-9 rounded-full px-3 text-[13px] font-medium border-border bg-[var(--bg-secondary)] hover:bg-[var(--interactive-bg-secondary-hover)] text-foreground">
                <GptStudyIcon className="size-4 mr-1" /> Study
              </Button>
              <div className="ms-auto flex items-center gap-1.5">
                <Button type="button" aria-label="Start voice mode" variant="ghost" className="relative flex h-9 items-center justify-center rounded-full min-w-8 p-2 text-foreground hover:opacity-80 bg-[var(--gray-600)]">
                  <div className="flex items-center justify-center">
                    <GptVoiceIcon className="size-5" />
                  </div>
                  <span className="ps-1 pe-1 text-[13px] font-semibold">Voice</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}

export default Hero


