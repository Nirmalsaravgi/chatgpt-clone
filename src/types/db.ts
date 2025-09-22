import type { ObjectId } from "mongodb"

export type ThreadDoc = {
  _id?: ObjectId
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  lastMessageAt?: Date
  summary?: string
}

export type MessagePart = { type: 'text'; text: string } | { type: 'image'; image: { url: string } }

export type Attachment = { name: string; url: string; mimeType: string; size: number }

export type MessageDoc = {
  _id?: ObjectId
  threadId: ObjectId
  userId: string
  role: 'user' | 'assistant' | 'system'
  parts: MessagePart[]
  attachments?: Attachment[]
  createdAt: Date
  tokensIn?: number
  tokensOut?: number
}
