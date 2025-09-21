"use client"
import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChatGPTLogo } from "@/components/icons/ChatGPTLogo"
import { cn } from "@/lib/utils"

export function ModelSwitcher() {
  const [model, setModel] = React.useState<"chatgpt" | "go">("chatgpt")

  return (
    <div className="px-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 rounded-full px-3 py-2 text-sm hover:bg-[var(--interactive-bg-secondary-hover)]">
            <span>ChatGPT</span>
            <ChevronDown className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className="p-0 w-[360px] rounded-[14px] overflow-hidden border border-border bg-[var(--bg-elevated-primary)] shadow-lg">
          <div className="divide-y divide-border">
            <DropdownMenuItem onClick={() => setModel("go")} className="p-4 gap-3 items-start focus:bg-[var(--interactive-bg-secondary-hover)]">
              <div className="mt-0.5 text-foreground/80"><DiamondIcon /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">ChatGPT Go</div>
                  <span className="text-xs font-semibold rounded-full px-3 py-1 bg-[var(--interactive-bg-secondary-hover)] text-foreground/80">Upgrade</span>
                </div>
                <div className="text-xs text-foreground/70 mt-1">Our smartest model & more</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setModel("chatgpt")} className="p-4 gap-3 items-start focus:bg-[var(--interactive-bg-secondary-hover)]">
              <div className="mt-0.5 text-foreground/80"><ChatGPTLogo className="size-4" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">ChatGPT</div>
                  {model === "chatgpt" && <Check className="size-4" />}
                </div>
                <div className="text-xs text-foreground/70 mt-1">Great for everyday tasks</div>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
      <path d="M10 2l4 4-4 12L6 6l4-4z" opacity=".9" />
    </svg>
  )
}


