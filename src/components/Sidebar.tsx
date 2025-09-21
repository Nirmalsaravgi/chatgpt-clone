"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChatGPTLogo } from "@/components/icons/ChatGPTLogo"
import { GptCloseSidebarIcon } from "@/components/icons/GptCloseSidebarIcon"
import { GptSearchChatsIcon } from "@/components/icons/GptSearchChatsIcon"
import { GptLibraryIcon } from "@/components/icons/GptLibraryIcon"
import { GptSoraIcon } from "@/components/icons/GptSoraIcon"
import { GptGPTsIcon } from "@/components/icons/GptGPTsIcon"
import { Button } from "@/components/ui/button"
import { Plus, Search, BookOpen, PanelsTopLeft, Bot, FolderClosed, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUser } from "@clerk/nextjs"

export function Sidebar() {
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)
  const [showUpgrade, setShowUpgrade] = React.useState(true)
  const { user } = useUser()

  const fullName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Guest"
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("")

  const widthClass = collapsed ? "w-[72px]" : "w-[280px]"

  const goNewChat = () => router.push("/?model=auto")

  return (
    <aside className={`hidden md:flex ${widthClass} shrink-0 bg-[var(--bg-elevated-secondary)] text-foreground/90`}> 
      <div className="flex h-dvh w-full flex-col overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between h-14 px-2 bg-[var(--bg-elevated-secondary)]">
          <div className="flex items-center gap-2">
            {collapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      aria-label="Open sidebar"
                      className="group inline-flex items-center justify-center rounded-lg p-1.5 hover:bg-[var(--interactive-bg-secondary-hover)]"
                      onClick={() => setCollapsed(false)}
                    >
                      <span className="relative inline-flex items-center justify-center size-5">
                        <ChatGPTLogo className="size-5 transition-opacity group-hover:opacity-0" />
                        <GptCloseSidebarIcon className="size-5 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                    Open sidebar
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <>
                <span className="inline-flex items-center justify-center rounded-md p-1.5 text-foreground">
                  <ChatGPTLogo className="size-5" />
                </span>
                <span className="text-sm font-medium">ChatGPT</span>
              </>
            )}
          </div>
          {!collapsed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Close sidebar"
                    className="rounded-md p-1.5 hover:bg-[var(--interactive-bg-secondary-hover)]"
                    onClick={() => setCollapsed(true)}
                  >
                    <GptCloseSidebarIcon className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                  Close sidebar
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 px-2 py-3 space-y-4">
          {/* Primary actions */}
          <nav className="space-y-1">
            <SidebarItem icon={<Plus className="size-4" />} label="New chat" collapsed={collapsed} onClick={goNewChat} />
            <SidebarItem icon={<GptSearchChatsIcon className="size-4" />} label="Search chats" collapsed={collapsed} />
            <SidebarItem icon={<GptLibraryIcon className="size-4" />} label="Library" collapsed={collapsed} />
          </nav>

          {/* Secondary (hidden when collapsed) */}
          {!collapsed && (
            <div className="space-y-1 pt-2">
              <SidebarItem icon={<GptSoraIcon className="size-4" />} label="Sora" collapsed={collapsed} />
              <SidebarItem icon={<GptGPTsIcon className="size-4" />} label="GPTs" collapsed={collapsed} />
              <SidebarItem icon={<FolderClosed className="size-4" />} label="Resume" collapsed={collapsed} />
            </div>
          )}

          {/* Projects (hidden when collapsed) */}
          {!collapsed && (
            <div className="pt-2">
              <SidebarItem
                icon={<FolderClosed className="size-4" />}
                label="Projects"
                collapsed={collapsed}
                endAdornment={!collapsed ? (
                  <span className="ml-auto text-[10px] font-semibold rounded-full px-2 py-0.5 bg-[var(--interactive-bg-secondary-hover)] text-foreground/80">NEW</span>
                ) : undefined}
              />
            </div>
          )}

          {/* Chats list (hidden when collapsed) */}
          {!collapsed && (
            <div className="pt-2">
              <div className="px-2 pb-1 text-xs uppercase tracking-wide text-foreground/50">Chats</div>
              <div className="space-y-1">
                <ChatListItem title="Export decline and GST 2.0" />
                <ChatListItem title="Both me and I usage" />
                <ChatListItem title="Npm install log summary" />
                <ChatListItem title="Copy all text in nano" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div>
          {showUpgrade && !collapsed && (
            <div>
              <div className="relative z-10 flex w-full items-center justify-between rounded-t-2xl border border-border py-3 ps-4 pe-2 text-xs bg-[var(--bg-secondary)]">
                <span className="flex items-center gap-3">
                  <span className="text-[#5856D6]">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M17.665 10C17.665 10.6877 17.1785 11.2454 16.5488 11.3945L16.4219 11.4189C14.7098 11.6665 13.6129 12.1305 12.877 12.8623C12.1414 13.5938 11.6742 14.6843 11.4238 16.3887C11.3197 17.0973 10.7182 17.665 9.96484 17.665C9.27085 17.665 8.68836 17.1772 8.53613 16.5215C8.12392 14.7459 7.6623 13.619 6.95703 12.8652C6.31314 12.1772 5.39414 11.7268 3.88672 11.4688L3.57715 11.4199C2.88869 11.319 2.33496 10.734 2.33496 10C2.33496 9.26603 2.88869 8.681 3.57715 8.58008L3.88672 8.53125C5.39414 8.27321 6.31314 7.82277 6.95703 7.13477C7.6623 6.38104 8.12392 5.25413 8.53613 3.47852L8.56934 3.35742C8.76133 2.76356 9.31424 2.33496 9.96484 2.33496C10.7182 2.33497 11.3197 2.9027 11.4238 3.61133L11.5283 4.22266C11.7954 5.58295 12.2334 6.49773 12.877 7.1377C13.6129 7.86952 14.7098 8.33351 16.4219 8.58105C17.1119 8.68101 17.665 9.26667 17.665 10Z"></path>
                    </svg>
                  </span>
                  {!collapsed && <span className="text-foreground">Upgrade your plan</span>}
                </span>
                <button aria-label="Dismiss" className="rounded-full p-1 hover:bg-[var(--interactive-bg-secondary-hover)]" onClick={() => setShowUpgrade(false)}>
                  <X className="size-4" />
                </button>
              </div>
            </div>
          )}
          {!collapsed && (
          <div className="flex items-center gap-3 p-3 border-t border-border">
            <div className="inline-flex items-center justify-center size-8 rounded-full bg-[var(--interactive-bg-secondary-hover)] text-sm font-semibold">
              {initials}
            </div>
            <div className="flex flex-col">
              <div className="text-sm text-foreground/90 leading-tight max-w-[180px] truncate">{fullName}</div>
              <div className="text-xs text-foreground/60">Free</div>
            </div>
          </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function SidebarItem({ icon, label, collapsed, onClick, endAdornment }: { icon: React.ReactNode; label: string; collapsed: boolean; onClick?: () => void; endAdornment?: React.ReactNode }) {
  return (
    <button
      className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--interactive-bg-secondary-hover)]"
      onClick={onClick}
    >
      <span className="inline-flex items-center justify-center size-6 text-foreground/90">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && endAdornment}
    </button>
  )
}

function ChatListItem({ title }: { title: string }) {
  return (
    <button className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground/80 hover:bg-[var(--interactive-bg-secondary-hover)]">
      <span className="truncate text-left">{title}</span>
    </button>
  )
}


