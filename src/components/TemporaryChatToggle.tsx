"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GptTemporaryChatIcon } from "@/components/icons/GptTemporaryChatIcon"

export function TemporaryChatToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = (searchParams.get("tc") === "1")

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (active) {
      params.delete("tc")
    } else {
      params.set("tc", "1")
    }
    const qs = params.toString()
    router.push(qs ? `/?${qs}` : "/")
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label="Turn on temporary chat"
            aria-pressed={active}
            onClick={toggle}
            className={`rounded-md p-1.5 hover:bg-[var(--interactive-bg-secondary-hover)] ${active ? 'bg-[var(--interactive-bg-secondary-hover)]' : ''}`}
          >
            <GptTemporaryChatIcon className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
          {active ? 'Temporary chat is on' : 'Turn on temporary chat'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default TemporaryChatToggle


