"use client"
import * as React from "react"
// import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ChatGPTLogo } from "@/components/icons/ChatGPTLogo"
import { GptCloseSidebarIcon } from "@/components/icons/GptCloseSidebarIcon"
import { GptSearchChatsIcon } from "@/components/icons/GptSearchChatsIcon"
import { GptLibraryIcon } from "@/components/icons/GptLibraryIcon"
import { GptSoraIcon } from "@/components/icons/GptSoraIcon"
import { GptGPTsIcon } from "@/components/icons/GptGPTsIcon"
// import { Button } from "@/components/ui/button"
import { FolderClosed, X, MoreVertical, Trash2 } from "lucide-react"
import { GptNewChatIcon } from "@/components/icons/GptNewChatIcon"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUser } from "@clerk/nextjs"
import SearchChatsDialog from "@/components/SearchChatsDialog"

export function Sidebar() {
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)
  const [showUpgrade, setShowUpgrade] = React.useState(true)
  const { user } = useUser()
  const fetcher = (url: string) => fetch(url).then(r => r.json())
  const { data, mutate } = useSWR('/api/threads', fetcher)
  const items: any[] = Array.isArray(data?.items) ? data.items : []
  const [searchOpen, setSearchOpen] = React.useState(false)

  const fullName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Guest"
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("")

  const widthClass = collapsed ? "w-[72px]" : "w-[280px]"

  const goNewChat = async () => {
    router.push('/?model=auto')
  }

  return (
    <aside className={`hidden md:flex ${widthClass} shrink-0 bg-[var(--bg-elevated-secondary)] text-foreground/90`}>
      <div className="flex h-dvh w-full flex-col overflow-y-auto sidebar-scroll">
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
                <button
                  aria-label="Home"
                  onClick={() => router.push('/?model=auto')}
                  className="text-foreground hover:bg-[var(--interactive-bg-secondary-hover)] touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none"
                >
                  <ChatGPTLogo className="size-5" />
                </button>
                {/* <span className="text-sm font-medium">ChatGPT</span> */}
              </>
            )}
          </div>
          {!collapsed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Close sidebar"
                    className="text-foreground/70 hover:text-foreground rounded-lg touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center hover:bg-[var(--interactive-bg-secondary-hover)] cursor-w-resize rtl:cursor-e-resize"
                    onClick={() => setCollapsed(true)}
                  >
                    <GptCloseSidebarIcon className="size-5 max-md:hidden" />
                    <X className="size-5 md:hidden" />
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
        <div className="flex-1 px-2 py-3 space-y-4 pb-28 pb-safe">
          {/* Primary actions (sticky block under header) */}
          <div className="relative bg-[var(--bg-elevated-secondary)] pb-3">
            <nav className="space-y-1">
              <SidebarItem
                icon={<GptNewChatIcon className="size-5" />}
                label="New chat"
                collapsed={collapsed}
                onClick={goNewChat}
                shortcutKeys={['Ctrl', 'Shift', 'O']}
              />
              <SidebarItem
                icon={<GptSearchChatsIcon className="size-5" />}
                label="Search chats"
                collapsed={collapsed}
                onClick={() => setSearchOpen(true)}
                shortcutKeys={['Ctrl', 'K']}
              />
              <SidebarItem icon={<GptLibraryIcon className="size-5" />} label="Library" collapsed={collapsed} />
            </nav>
          </div>

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
                {items.map((t) => (
                  <ChatListItem key={t._id} threadId={t._id} title={t.title || 'New chat'} onDeleted={async () => {
                    await mutate()
                    // If we're on the deleted thread, route to root
                    // Best-effort: rely on sidebar state
                    router.push('/?model=auto')
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 bg-[var(--bg-elevated-secondary)]">
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
      <SearchChatsDialog open={searchOpen} onOpenChange={setSearchOpen} onNewChat={() => router.push('/?model=auto')} />
    </aside>
  )
}

function SidebarItem({ icon, label, collapsed, onClick, endAdornment, shortcutKeys }: { icon: React.ReactNode; label: string; collapsed: boolean; onClick?: () => void; endAdornment?: React.ReactNode; shortcutKeys?: string[] }) {
  return (
    <button
      className="group w-full flex items-center rounded-md px-2 h-9 text-sm hover:bg-[var(--interactive-bg-secondary-hover)]"
      onClick={onClick}
    >
      <div className="flex min-w-0 items-center gap-1.5 flex-1">
        <div className="flex items-center justify-center text-foreground/90">
          {icon}
        </div>
        {!collapsed && (
          <div className="flex min-w-0 grow items-center gap-2.5">
            <div className="truncate">{label}</div>
          </div>
        )}
      </div>
      {!collapsed && shortcutKeys && shortcutKeys.length > 0 && (
        <div className="ml-auto text-foreground/60 touch:hidden opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="inline-flex whitespace-pre items-center">
            {shortcutKeys.map((k, i) => (
              <React.Fragment key={i}>
                <kbd className="inline-flex items-center px-0 py-0 text-[11px] leading-none font-normal">
                  <span className="min-w-[1em]">{k}</span>
                </kbd>
                {i < shortcutKeys.length - 1 && <span className="px-0.5 inline-flex items-center align-middle text-[11px] leading-none">+</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      {!collapsed && endAdornment}
    </button>
  )
}

function ChatListItem({ title, threadId, onDeleted }: { title: string; threadId: string; onDeleted?: () => void }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const deleteThread = async () => {
    const res = await fetch(`/api/threads/${threadId}`, { method: 'DELETE' })
    if (res.ok) {
      setConfirmOpen(false)
      onDeleted?.()
    }
  }
  return (
    <div className="group relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/chat/${threadId}`)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/chat/${threadId}`) } }}
        className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground/80 hover:bg-[var(--interactive-bg-secondary-hover)] cursor-pointer"
      >
        <span className="truncate text-left">{title}</span>
        <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <button aria-label="More" onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }} className="p-1 rounded hover:bg-[var(--interactive-bg-secondary-hover)]">
            <MoreVertical className="size-4" />
          </button>
        </span>
      </div>
      {open && (
        <div className="absolute right-2 top-full mt-1 z-20 w-56 rounded-lg border border-border bg-[var(--bg-primary)] shadow-lg p-1">
          <button onClick={() => setConfirmOpen(true)} className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-red-500 hover:bg-[var(--interactive-bg-secondary-hover)]">
            <Trash2 className="size-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[320px] p-0 rounded-[12px] overflow-hidden bg-[var(--bg-primary)] border border-border">
          <div className="p-4">
            <DialogTitle className="text-base mb-2">Delete chat?</DialogTitle>
            <p className="text-sm text-foreground/70">This will permanently delete the chat and its messages.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="h-8 px-3 rounded-md text-sm hover:bg-[var(--interactive-bg-secondary-hover)]" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="h-8 px-3 rounded-md text-sm bg-red-600 text-white hover:bg-red-600/90" onClick={deleteThread}>Delete</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


