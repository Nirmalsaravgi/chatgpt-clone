"use client"
import * as React from "react"
import { Conversation } from "@/components/Conversation"
import type { MessagePart } from "@/types/db"

type UIMsg = { id: string; role: 'user' | 'assistant' | 'system'; parts?: MessagePart[]; content?: string }

export default function ConversationClient({ threadId, initialMessages, initialQuery }: { threadId: string; initialMessages: UIMsg[]; initialQuery?: string }) {
  return <Conversation initialQuery={initialQuery || ""} threadId={threadId} initialMessages={initialMessages} />
}


