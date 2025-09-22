import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getCollections } from "@/lib/db"
import { ObjectId } from "mongodb"

export const runtime = "nodejs"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const threadId = params.id
  const { threads, messages } = await getCollections()
  const thread = await threads.findOne({ _id: new ObjectId(threadId), userId })
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100)
  const items = await messages
    .find({ threadId: new ObjectId(threadId) })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray()

  return NextResponse.json({ items })
}


