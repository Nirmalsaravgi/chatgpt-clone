"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { GptAttachIcon } from "@/components/icons/GptAttachIcon"
import { GptSearchIcon } from "@/components/icons/GptSearchIcon"
import { GptStudyIcon } from "@/components/icons/GptStudyIcon"
import { GptVoiceIcon } from "@/components/icons/GptVoiceIcon"

type Props = {
  onSubmit?: (text: string) => void
  className?: string
  iconsOnly?: boolean
  onAttachClick?: () => void
  onSearchClick?: () => void
  onStudyClick?: () => void
  onVoiceClick?: () => void
}

export function ComposerBar({ onSubmit, className, iconsOnly, onAttachClick, onSearchClick, onStudyClick, onVoiceClick }: Props) {
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
    const value = text.trim()
    if (!value) return
    onSubmit?.(value)
    setText("")
    setInputHeight(BASE_HEIGHT)
    setIsOverflowing(false)
  }

  return (
    <div className={className}>
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
            <Button
              onClick={onAttachClick}
              variant="outline"
              className={
                iconsOnly
                  ? "h-9 w-9 min-w-9 p-2 rounded-full border-border bg-[var(--bg-secondary)] hover:bg-[var(--interactive-bg-secondary-hover)] text-foreground justify-center"
                  : "h-9 rounded-full px-3 text-[13px] font-semibold border-border bg-[var(--bg-secondary)] hover:bg-[var(--interactive-bg-secondary-hover)] text-foreground"
              }
            >
              <GptAttachIcon className={`size-4 ${iconsOnly ? "" : "mr-1"}`} />
              {!iconsOnly && <span className="hidden sm:inline">Attach</span>}
            </Button>
            <Button
              onClick={onSearchClick}
              variant="outline"
              className={
                iconsOnly
                  ? "h-9 w-9 min-w-9 p-2 rounded-full border-border bg-[var(--bg-secondary)] hover:bg-[var(--interactive-bg-secondary-hover)] text-foreground justify-center"
                  : "h-9 rounded-full px-3 text-[13px] font-medium border-border bg-[var(--bg-secondary)] hover:bg-[var(--interactive-bg-secondary-hover)] text-foreground"
              }
            >
              <GptSearchIcon className={`size-4 ${iconsOnly ? "" : "mr-1"}`} />
              {!iconsOnly && <span className="hidden sm:inline">Search</span>}
            </Button>
            <Button
              onClick={onStudyClick}
              variant="outline"
              className={
                iconsOnly
                  ? "h-9 w-9 min-w-9 p-2 rounded-full border-border bg-[var(--bg-secondary)] hover:bg-[var(--interactive-bg-secondary-hover)] text-foreground justify-center"
                  : "h-9 rounded-full px-3 text-[13px] font-medium border-border bg-[var(--bg-secondary)] hover:bg-[var(--interactive-bg-secondary-hover)] text-foreground"
              }
            >
              <GptStudyIcon className={`size-4 ${iconsOnly ? "" : "mr-1"}`} />
              {!iconsOnly && <span className="hidden sm:inline">Study</span>}
            </Button>
            <div className="ms-auto flex items-center gap-1.5">
              <Button
                onClick={onVoiceClick}
                type="button"
                aria-label="Start voice mode"
                variant="ghost"
                className="relative flex h-9 items-center justify-center rounded-full min-w-8 p-2 text-foreground hover:opacity-80 bg-[var(--gray-600)]"
              >
                <div className="flex items-center justify-center">
                  <GptVoiceIcon className="size-5" />
                </div>
                <span className="ps-1 pe-1 text-[13px] font-semibold hidden sm:inline">Voice</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComposerBar


