import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getCollections } from "@/lib/db"
import { ObjectId } from "mongodb"

export const runtime = "nodejs"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const threadId = params.id
    if (!threadId) return NextResponse.json({ error: "Thread ID required" }, { status: 400 })

    const { threads, messages } = await getCollections()
    const _id = new ObjectId(threadId)

    // Verify ownership
    const thread = await threads.findOne({ _id, userId })
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await Promise.all([
      messages.deleteMany({ threadId: _id }),
      threads.deleteOne({ _id }),
    ])

    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete thread" }, { status: 500 })
  }
}


