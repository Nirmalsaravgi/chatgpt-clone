import { auth } from "@clerk/nextjs/server"
import { getCollections } from "@/lib/db"
import { ObjectId } from "mongodb"
import ConversationClient from "./ConversationClient"
// import { redirect } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { ModelSwitcher } from "@/components/ModelSwitcher"
import { TemporaryChatToggle } from "@/components/TemporaryChatToggle"

export default async function Page({ params, searchParams }: { params: Promise<{ threadId: string }>, searchParams?: Promise<Record<string, string>> }) {
  const { userId } = await auth()
  if (!userId) return null

  const [{ threadId }, sp] = await Promise.all([params, (searchParams as any) || Promise.resolve({})])
  const { threads, messages } = await getCollections()
  const thread = await threads.findOne({ _id: new ObjectId(threadId), userId })
  if (!thread) return null
  const items = await messages.find({ threadId: new ObjectId(threadId) }).sort({ createdAt: 1 }).limit(200).toArray()
  const initialMessages = items.map((m: any) => ({ id: m._id.toString(), role: m.role, parts: m.parts }))

  // If navigated with ?q= carry the first message into Conversation initialQuery (one-shot)
  const query = (sp && (await sp))?.q || ""

  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 flex items-stretch justify-stretch">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-10 h-14 flex items-center justify-between px-2 bg-[var(--bg-primary)]">
            <ModelSwitcher />
            <TemporaryChatToggle />
          </div>
          <div className="flex-1">
            <ConversationClient threadId={threadId} initialMessages={initialMessages} initialQuery={query} />
          </div>
        </div>
      </main>
    </div>
  )
}


