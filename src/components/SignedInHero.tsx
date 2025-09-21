"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Mic, AudioLines } from "lucide-react"

interface Props { onSubmit?: (text: string) => void }

export function SignedInHero({ onSubmit }: Props) {
  const [text, setText] = React.useState("")
  const [showUpgrade, setShowUpgrade] = React.useState(true)
  const submit = () => { if (text.trim()) { onSubmit?.(text.trim()); setText("") } }
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") submit() }

  return (
    <section className="w-full min-h-[calc(100dvh-56px)] flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-[32px] sm:text-[36px] leading-tight font-semibold text-foreground mb-6">What's on the agenda today?      </h1>
      <div className="w-full max-w-[980px]">
        <div className="flex items-center bg-[var(--bg-secondary)] border border-border rounded-[14px] h-[48px] px-3">
          <input
            type="text"
            placeholder="Ask anything"
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-foreground/50"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
          />
          <div className="flex items-center gap-2">
            <button aria-label="Voice" className="rounded-full p-2 hover:bg-[var(--interactive-bg-secondary-hover)]">
              <Mic className="size-4" />
            </button>
            <button aria-label="Input mode" className="rounded-full p-2 hover:bg-[var(--interactive-bg-secondary-hover)]">
              <AudioLines className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {showUpgrade && (
        <div className="hidden sm:flex justify-center pt-8 w-full">
          <div className="relative">
            <button
              type="button"
              className="group flex w-full items-center justify-center gap-1.5 rounded-full py-2 ps-3 pe-7 sm:justify-start sm:gap-2 bg-[var(--bg-secondary)] border border-border shadow-sm hover:bg-[var(--interactive-bg-secondary-hover)] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span className="hidden sm:inline text-[#5856D6]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M17.665 10C17.665 10.6877 17.1785 11.2454 16.5488 11.3945L16.4219 11.4189C14.7098 11.6665 13.6129 12.1305 12.877 12.8623C12.1414 13.5938 11.6742 14.6843 11.4238 16.3887C11.3197 17.0973 10.7182 17.665 9.96484 17.665C9.27085 17.665 8.68836 17.1772 8.53613 16.5215C8.12392 14.7459 7.6623 13.619 6.95703 12.8652C6.31314 12.1772 5.39414 11.7268 3.88672 11.4688L3.57715 11.4199C2.88869 11.319 2.33496 10.734 2.33496 10C2.33496 9.26603 2.88869 8.681 3.57715 8.58008L3.88672 8.53125C5.39414 8.27321 6.31314 7.82277 6.95703 7.13477C7.6623 6.38104 8.12392 5.25413 8.53613 3.47852L8.56934 3.35742C8.76133 2.76356 9.31424 2.33496 9.96484 2.33496C10.7182 2.33497 11.3197 2.9027 11.4238 3.61133L11.5283 4.22266C11.7954 5.58295 12.2334 6.49773 12.877 7.1377C13.6129 7.86952 14.7098 8.33351 16.4219 8.58105C17.1119 8.68101 17.665 9.26667 17.665 10Z" />
                  </svg>
                </span>
                <span className="text-foreground text-[13px] leading-[18px] sm:text-sm sm:leading-5">Unlock extra messages, images & more</span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#5856D6]">
                <span className="hidden sm:inline">Upgrade plan</span>
                <span className="sm:hidden">Upgrade</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowUpgrade(false)}
              className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-foreground/70 hover:bg-[var(--interactive-bg-secondary-hover)]"
              aria-label="Dismiss banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}


