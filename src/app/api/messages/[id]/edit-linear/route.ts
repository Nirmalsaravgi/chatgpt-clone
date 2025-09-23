import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getCollections } from "@/lib/db"
import { ObjectId } from "mongodb"

export const runtime = "nodejs"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const messageId = params.id
    if (!messageId) return NextResponse.json({ error: "Message ID required" }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const text: string = (body?.text || "").toString()
    if (!text.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 })

    const { threads, messages } = await getCollections()
    const _id = new ObjectId(messageId)
    const target = await messages.findOne({ _id })
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (target.role !== 'user') return NextResponse.json({ error: "Only user messages can be edited" }, { status: 400 })

    const threadId: ObjectId | undefined = target.threadId
    if (!threadId) return NextResponse.json({ error: "Invalid message" }, { status: 400 })

    const thread = await threads.findOne({ _id: threadId, userId })
    if (!thread) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    // Delete target and all following messages by createdAt
    await messages.deleteMany({ threadId, createdAt: { $gte: target.createdAt } })

    const now = new Date()
    await threads.updateOne({ _id: threadId }, { $set: { updatedAt: now, lastMessageAt: now, title: text.slice(0, 60) } })

    return NextResponse.json({ threadId: threadId.toString() })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to edit" }, { status: 500 })
  }
}


