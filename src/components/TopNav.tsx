"use client"
import * as React from "react"
// import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { ChatGPTLogo } from "@/components/icons/ChatGPTLogo"
import { GptNewChatIcon } from "@/components/icons/GptNewChatIcon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { HelpCircle } from "lucide-react"

export function TopNav() {
  const router = useRouter()
  const [chatStarted, setChatStarted] = React.useState(false)

  React.useEffect(() => {
    try {
      setChatStarted(!!localStorage.getItem("ls_chat_started"))
    } catch {}
    const onFlag = () => {
      try {
        setChatStarted(!!localStorage.getItem("ls_chat_started"))
      } catch {}
    }
    window.addEventListener("ls_chat_started_change", onFlag)
    return () => window.removeEventListener("ls_chat_started_change", onFlag)
  }, [])
  return (
    <header className="absolute top-0 inset-x-0 z-20 h-[52px] p-2 flex items-center pointer-events-none select-none">
      <div className="w-full max-w-[1536px] mx-auto flex items-center justify-between *:pointer-events-auto">
        {/* Left: desktop (md+) */}
        <div className="hidden md:flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => router.push("/?model=auto")} className="group text-foreground/80 hover:text-foreground transition-colors flex items-center">
                  <span className="relative size-6">
                    <ChatGPTLogo className="size-6 group-hover:opacity-0 transition-opacity" />
                    <GptNewChatIcon className="size-6 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                New chat
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {chatStarted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-lg px-2 py-1 rounded-full hover:bg-[var(--interactive-bg-secondary-hover)]">
                  <span>ChatGPT</span>
                  <ChevronDown className="size-4 text-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="p-0 w-[360px] rounded-[16px] overflow-hidden border border-border bg-[var(--bg-primary)]">
                <div className="h-[140px] bg-[linear-gradient(135deg,#9aa6ff_0%,#e2c2ff_50%,#a0e9ff_100%)]" />
                <div className="bg-[var(--bg-tertiary,rgba(0,0,0,0.85))] p-5 text-left">
                  <div className="text-lg font-semibold mb-2">Try advanced features for free</div>
                  <p className="text-sm text-foreground/80 mb-4">Get smarter responses, upload files, create images, and more by logging in.</p>
                  <div className="flex items-center gap-3">
                    <SignInButton mode="modal">
                      <button className="h-9 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90">Log in</button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="h-9 px-4 rounded-full border border-border text-sm font-medium hover:bg-[var(--interactive-bg-secondary-hover)]">Sign up for free</button>
                    </SignUpButton>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {/* Left: mobile (<md) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => router.push("/?model=auto")}
            className="flex items-center gap-2 h-9 px-3 rounded-[10px] hover:bg-[var(--interactive-bg-secondary-hover)]"
          >
            <GptNewChatIcon className="size-5" />
            {/* <span className="text-sm">New chat</span> */}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-sm px-2 py-1 rounded-full hover:bg-[var(--interactive-bg-secondary-hover)]">
                <span>ChatGPT</span>
                <ChevronDown className="size-4 text-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8} className="p-0 w-[300px] rounded-[16px] overflow-hidden border border-border bg-[var(--bg-primary)]">
              <div className="h-[120px] bg-[linear-gradient(135deg,#9aa6ff_0%,#e2c2ff_50%,#a0e9ff_100%)]" />
              <div className="bg-[var(--bg-tertiary,rgba(0,0,0,0.85))] p-4 text-left">
                <div className="text-base font-semibold mb-2">Try advanced features for free</div>
                <p className="text-xs text-foreground/80 mb-3">Get smarter responses, upload files, create images, and more by logging in.</p>
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button className="h-8 px-3 rounded-full bg-white text-black text-xs font-medium hover:bg-white/90">Log in</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="h-8 px-3 rounded-full border border-border text-xs font-medium hover:bg-[var(--interactive-bg-secondary-hover)]">Sign up</button>
                  </SignUpButton>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-[12px] ms-auto md:ms-0">
          <SignedOut>
            <SignInButton mode="redirect">
              <Button className="h-9 px-[16px] rounded-full text-sm bg-white text-black hover:bg-white/90">Log in</Button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <Button variant="outline" className="hidden md:inline-flex h-9 px-[16px] rounded-full text-sm">Sign up for free</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/?model=auto" />
          </SignedIn>
          <Button aria-label="Help" variant="ghost" className="hidden md:inline-flex h-9 px-[14px] rounded-full text-sm">
            <HelpCircle className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default TopNav


