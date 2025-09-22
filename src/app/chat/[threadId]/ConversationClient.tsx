"use client"
import * as React from "react"
import { Conversation } from "@/components/Conversation"

export default function ConversationClient({ threadId, initialMessages, initialQuery }: { threadId: string; initialMessages: any[]; initialQuery?: string }) {
  return <Conversation initialQuery={initialQuery || ""} threadId={threadId} initialMessages={initialMessages} />
}


