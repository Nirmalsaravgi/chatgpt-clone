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
  const submit = () => {
    if (!text.trim()) return
    onSubmit?.(text.trim())
  }
  return (
    <section className="w-full flex flex-col items-center justify-center py-[120px] px-[16px] md:px-[24px] lg:px-[32px]">
      <h1 className="text-[40px] leading-[44px] font-semibold tracking-[-0.02em] text-foreground mb-[28px]">
        ChatGPT
      </h1>
      <div className="w-full mx-auto max-w-[56rem] md:max-w-[64rem] lg:max-w-[72rem] xl:max-w-[80rem]">
        <div
          className="group/composer bg-[var(--bg-secondary)] text-secondary-foreground p-2.5 grid grid-cols-[auto_1fr_auto] [grid-template-areas:'header_header_header'_'leading_primary_trailing'_'._footer_.'] rounded-[28px] shadow-sm border border-border overflow-clip bg-clip-padding"
          style={{ containIntrinsicSize: "auto 56px" }}
        >
          <div className="-my-2.5 flex min-h-14 items-center overflow-x-hidden px-1.5 [grid-area:primary] group-data-expanded/composer:mb-0 group-data-expanded/composer:px-2.5">
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

          <div className="flex items-center gap-2 [grid-area:trailing] ms-auto"></div>

          <div className="-m-1 max-w-full overflow-x-auto p-1 [grid-area:footer] [scrollbar-width:none]">
            <div className="flex min-w-fit items-center gap-1.5 ps-0 pe-1.5">
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
      </div>
    </section>
  )
}

export default Hero


