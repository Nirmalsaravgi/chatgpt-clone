# Chat Persistence and Threads – Implementation Plan

## Current State (baseline)
- Auth via Clerk; signed-in UI with sidebar and model switcher.
- Chat streaming via Vercel AI SDK + Google; file uploads via Uploadcare.
- Memory (mem0) hybrid read/write; temporary chat toggle; no DB yet.
- Sidebar shows hardcoded example chats (non-persisted).

## Goals
1. Persist user threads and messages in MongoDB.
2. Sidebar lists user threads (title, last message/date) and opens a thread on click.
3. Chat route loads messages and streams new ones into the same thread.
4. New Chat creates a fresh thread and navigates to it.
5. mem0 uses stable DB `threadId` and continues hybrid global/thread memory.
6. Keep UX snappy, streaming smooth, and code modular.

## Data Model (MongoDB)
- Collection: `users` (metadata only if needed)
- Collection: `threads`
  - _id: ObjectId
  - userId: string (Clerk user id)
  - title: string (first user message or user-edited)
  - createdAt: Date, updatedAt: Date
  - lastMessageAt: Date
  - summary: string (optional, future)
- Collection: `messages`
  - _id: ObjectId
  - threadId: ObjectId (ref threads)
  - userId: string
  - role: 'user' | 'assistant' | 'system'
  - parts: Array<{ type: 'text' | 'image', text?: string, image?: { url: string } }>
  - attachments?: Array<{ name: string; url: string; mimeType: string; size: number }>
  - createdAt: Date
  - tokensIn?: number (optional)
  - tokensOut?: number (optional)

Indexes:
- `threads`: { userId: 1, updatedAt: -1 }, { userId: 1, lastMessageAt: -1 }
- `messages`: { threadId: 1, createdAt: 1 }

## Env & Connection
- `.env.local`
  - `MONGODB_URI=...`
  - Optional: `MONGODB_DB=...`
- IMPLEMENTED: `src/lib/db.ts` Mongo client + `getCollections()`

## Server APIs
- Threads
  - IMPLEMENTED: `GET /api/threads` → list current user threads
  - IMPLEMENTED: `POST /api/threads` → create a new thread (returns threadId)
- Messages
  - IMPLEMENTED: `GET /api/threads/:id/messages` → fetch messages (sorted by createdAt asc)

## Chat Streaming Integration
- IMPLEMENTED (Phase 1): `/api/chat` accepts `threadId`, uses DB threadId for mem0, persists the latest user message (parts + attachments), and updates thread timestamps.
- IMPLEMENTED (Phase 2): tee the assistant text stream and persist the assistant message at stream end; update thread timestamps.
- Next: If no `threadId` is provided, create a new thread on the first user turn and return the id to the client.

## Client Routing
- Pages
  - `/` (existing landing)
  - Next: `/chat/[threadId]` → load thread and render transcript + composer.
- Navigation
  - Next: New Chat → `POST /api/threads` then route to `/chat/[threadId]`.
  - Next: Sidebar list → clicking routes to `/chat/[threadId]`.

## Sidebar Wiring
- Next: Replace hardcoded items with `GET /api/threads`.
- Show title + relative `lastMessageAt`.

## Conversation Component Updates
- Next: Accept `threadId` from route; pass in `sendMessage` body.
- Next: On mount, fetch `GET /api/threads/:id/messages` and render.

## Performance & Reliability
- Use lean projections for list endpoints (id, title, lastMessageAt).
- Paginate messages (e.g., 50 per page); lazy load older.
- Add indexes as above (create on first access or via script).

## Security
- All endpoints authorize by Clerk `userId`.

## mem0 Alignment
- IMPLEMENTED: use DB `threadId` for thread-scoped search/write; hybrid search (thread + global) and write (both).
- Temporary chat continues to bypass memory read/write.

## Step-by-step Checklist
1) DB connection util (DONE)
2) Collections/types (DONE)
3) Threads API (DONE)
4) Messages API (DONE)
5) Persist user + assistant messages in `/api/chat` (DONE)
6) Route `/chat/[threadId]`, client fetching (NEXT)
7) Sidebar wired to threads API (NEXT)
8) New Chat flow → create + navigate (NEXT)
9) mem0 already using DB threadId (DONE)
10) Indexes & pagination (NEXT)

## Future Enhancements
- Soft delete + archive threads.
- Rename thread automatically using first answer summary.
- Full-text search over messages.
- Summarization for long threads, storing rolling summaries.
