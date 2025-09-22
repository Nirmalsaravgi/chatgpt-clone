import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getCollections } from "@/lib/db"
import { ObjectId } from "mongodb"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { threads } = await getCollections()
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50)
  const cursor = url.searchParams.get("cursor")
  const query: any = { userId }
  const sort = { updatedAt: -1 }
  const find = threads.find(query).sort(sort).limit(limit)
  const list = await find.toArray()
  return NextResponse.json({ items: list })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { threads } = await getCollections()
  const now = new Date()
  const body = await req.json().catch(() => ({}))
  const title = (body?.title || "New chat").toString()

  const result = await threads.insertOne({
    userId,
    title,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  })
  return NextResponse.json({ threadId: result.insertedId })
}


