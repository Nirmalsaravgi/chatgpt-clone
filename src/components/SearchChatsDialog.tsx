"use client"
import * as React from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { GptNewChatIcon } from "@/components/icons/GptNewChatIcon"

type ThreadItem = {
  _id: string
  title?: string
  createdAt?: string | Date
}

function fetcher(url: string) { return fetch(url).then(r => r.json()) }

function normalizeDate(d: string | Date | undefined): Date | null {
  if (!d) return null
  try { return new Date(d as any) } catch { return null }
}

function groupThreads(items: ThreadItem[]) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOf7DaysAgo = new Date(startOfToday)
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7)
  const startOf30DaysAgo = new Date(startOfToday)
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30)

  const buckets: Record<string, ThreadItem[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    "Previous 30 Days": [],
    Earlier: [],
  }

  for (const t of items) {
    const created = normalizeDate(t.createdAt) || new Date(0)
    if (created >= startOfToday) buckets["Today"].push(t)
    else if (created >= startOfYesterday) buckets["Yesterday"].push(t)
    else if (created >= startOf7DaysAgo) buckets["Previous 7 Days"].push(t)
    else if (created >= startOf30DaysAgo) buckets["Previous 30 Days"].push(t)
    else buckets["Earlier"].push(t)
  }

  return buckets
}

export default function SearchChatsDialog({ open, onOpenChange, onNewChat }: { open: boolean; onOpenChange: (v: boolean) => void; onNewChat: () => void }) {
  const router = useRouter()
  const { data } = useSWR('/api/threads?limit=200', fetcher)
  const all: ThreadItem[] = Array.isArray(data?.items) ? data.items : []
  const [q, setQ] = React.useState("")

  const items = React.useMemo(() => {
    if (!q.trim()) return all
    const s = q.trim().toLowerCase()
    return all.filter(t => (t.title || "").toLowerCase().includes(s))
  }, [all, q])

  const grouped = React.useMemo(() => groupThreads(items), [items])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 w-full max-w-md md:max-w-[680px] md:min-w-[680px] rounded-2xl border border-border bg-[#2F2F2F] bg-clip-padding shadow-[0_14px_62px_0_rgba(0,0,0,0.25)]"
      >
        <div className="grow overflow-y-auto">
          <div className="flex flex-col max-h-[440px] min-h-[440px]">
            {/* Header row: input + X */}
            <div className="ms-3 me-4 flex max-h-[64px] min-h-[64px] items-center justify-between">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search chats..."
                className="w-full border-none bg-transparent focus:border-transparent focus:ring-0 focus:outline-hidden placeholder:text-foreground/50"
              />
              <button
                className="ms-4 rounded-full p-1 hover:bg-[var(--interactive-bg-secondary-hover)]"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-5 text-foreground/60 hover:text-foreground" />
              </button>
            </div>
            <hr className="border-border" />

            {/* Body section: new chat + grouped chats */}
            <div className="my-2 grow overflow-y-auto">
              <div>
                <ol className="mx-2">
                  {/* New chat */}
                  <li>
                    <div className="cursor-pointer">
                      <button
                        className="group relative flex items-center rounded-xl px-4 py-3 w-full text-left hover:bg-[var(--interactive-bg-secondary-hover)]"
                        onClick={() => { onOpenChange(false); onNewChat() }}
                      >
                        <GptNewChatIcon className="size-5" />
                        <div className="relative grow overflow-hidden whitespace-nowrap ps-2">
                          <div className="text-sm">New chat</div>
                        </div>
                      </button>
                    </div>
                  </li>

                  {Object.entries(grouped).map(([section, list]) => (
                    list.length ? (
                      <React.Fragment key={section}>
                        <li>
                          <div className="group text-foreground/60 relative my-2 px-4 pt-2 text-xs leading-4">{section}</div>
                        </li>
                        {list.map((t) => (
                          <li key={t._id}>
                            <div className="cursor-pointer">
                              <button
                                className="group relative flex items-center rounded-xl px-4 py-3 w-full text-left hover:bg-[var(--interactive-bg-secondary-hover)]"
                                onClick={() => { onOpenChange(false); router.push(`/chat/${t._id}`) }}
                              >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                  <path d="M16.835 9.99968C16.8348 6.49038 13.8111 3.58171 10 3.58171C6.18893 3.58171 3.16523 6.49038 3.16504 9.99968C3.16504 11.4535 3.67943 12.7965 4.55273 13.8766C4.67524 14.0281 4.72534 14.2262 4.68945 14.4176C4.59391 14.9254 4.45927 15.4197 4.30469 15.904C4.93198 15.8203 5.5368 15.6959 6.12793 15.528L6.25391 15.5055C6.38088 15.4949 6.5091 15.5208 6.62305 15.5817C7.61731 16.1135 8.76917 16.4186 10 16.4186C13.8112 16.4186 16.835 13.5091 16.835 9.99968ZM18.165 9.99968C18.165 14.3143 14.4731 17.7487 10 17.7487C8.64395 17.7487 7.36288 17.4332 6.23438 16.8757C5.31485 17.118 4.36919 17.2694 3.37402 17.3307C3.14827 17.3446 2.93067 17.2426 2.79688 17.0602C2.66303 16.8778 2.63177 16.6396 2.71289 16.4284L2.91992 15.863C3.08238 15.3953 3.21908 14.9297 3.32227 14.4606C2.38719 13.2019 1.83496 11.6626 1.83496 9.99968C1.83515 5.68525 5.52703 2.25163 10 2.25163C14.473 2.25163 18.1649 5.68525 18.165 9.99968Z"></path>
                                </svg>
                                <div className="relative grow overflow-hidden whitespace-nowrap ps-2">
                                  <div className="text-sm truncate">{t.title || 'New chat'}</div>
                                </div>
                              </button>
                            </div>
                          </li>
                        ))}
                      </React.Fragment>
                    ) : null
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


