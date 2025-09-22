# Memory / Conversation Context (mem0) – Implementation Plan

## 0) Current Chat Implementation (What exists now)

High-level overview of what we already have in place:

- API: `src/app/api/chat/route.ts`
  - Uses Vercel AI SDK `streamText` with Google (Gemini) via `@ai-sdk/google`.
  - Accepts UI messages from the client, trims to budget (token window) using `gpt-tokenizer` logic, and converts to ModelMessages.
  - Correctly constructs parts for mixed content; image attachments are passed as `{ type: 'image', image: { url } }`.
  - Streams the response back, compatible with multiple SDK response variants.
- Client: `src/components/Conversation.tsx`
  - Uses `useChat` from `@ai-sdk/react` with `TextStreamChatTransport` for streaming.
  - Handles sending text and uploaded files (Uploadcare) and displays markdown-rendered responses.
  - Composer supports attach, drag-and-drop, paste, and renders copy controls.
- Uploads
  - `/api/uploads` stores files in Uploadcare and returns canonical URLs.
  - User messages include attachment links; for images, the API sends structured image parts to the model.

This provides a solid base to add retrieval and storage of user memories around a conversation.

---

## 1) Goals for Memory (mem0)

- Personalization across sessions: remember user facts and preferences (name, locale, tone, stack, units).
- Task continuity: recall ongoing projects, documents, and context without re-asking each session.
- Token efficiency: inject only relevant memory instead of replaying entire history.
- Controls: allow temporary chats (no read/write), and future manage/forget/export operations.

Non-goals in initial phase:
- Full memory UI management (list, edit, delete) – plan for later.
- Complex summarization pipeline (basic relevance via mem0 is sufficient to start).

---

## 2) Architecture Overview

We will integrate mem0 via server-side calls inside the chat API route. At a high level:

1. Identity: use Clerk `userId` as the mem0 `user_id` (anonymous users can be given an ephemeral id).
2. Retrieval (pre-response): before invoking the model, fetch relevant memories for the current user and query. Inject them as a concise system prompt.
3. Writing (post-message): after receiving the user message (and optionally after the assistant’s reply), upsert new/updated memories to mem0.
4. Temporary chat: if enabled (will come from client via flag), skip both read and write.

Data flow in `POST /api/chat`:

```
Client → /api/chat
  body: { messages, model, attachments, temporaryChat? }

Server /api/chat:
  - Extract userId (Clerk) and threadId (derived or provided)
  - If !temporaryChat:
      relevant = mem0.search({ user_id: userId, query: lastUserText, topK })
      systemMemory = format(relevant)  // concise bullet points
  - Build messages: [ {role: 'system', content: systemMemory}, ...user/assistant messages with parts ]
  - streamText(model, messages)
  - If !temporaryChat:
      mem0.upsert({ user_id: userId, text: lastUserText, tags: [threadId] })
```

---

## 3) Required Configuration

- `.env.local`
  - `MEM0_API_KEY=...`
  - `MEM0_BASE_URL=https://api.mem0.ai` (or as per mem0 docs)

We will use a light server wrapper around mem0’s REST API to avoid direct SDK coupling and centralize error handling.

---

## 4) New Server Utilities

Create `src/lib/memory.ts` with the following exports:

- `searchMemories({ userId, query, topK, threadId? })`
  - Calls `GET/POST` (per mem0 API) to retrieve most relevant memories for the query.
  - Returns array of memory objects `{ id, text, score, metadata }`.

- `upsertMemory({ userId, text, threadId?, metadata? })`
  - Calls mem0 to add/update a memory extracted from the user’s input.

- `deleteMemory({ userId, memoryId })` (future UI)
  - Soft-deletes/removes a memory.

- `formatMemoriesForSystemPrompt(memories)`
  - Returns a compact string, e.g.:
    - "Relevant user memories:\n- Prefers TypeScript\n- Writes in British English\n- Project: ‘Resume refactor’"

Implementation considerations:
- Add robust fetch wrapper with Authorization header, timeout, and retries.
- Tagging: include `threadId` and feature tags (e.g., `chat`, `uploads`) for future filtering.

---

## 5) Chat API Integration Steps

In `src/app/api/chat/route.ts`:

1. Identify user and flags
   - Import `auth` from `@clerk/nextjs/server` and read `userId`.
   - Parse a boolean `temporaryChat` from request body (default false).
   - Compute a `threadId`: use a stable id from the first user message id in the request, or generate one and echo it back later (future enhancement).

2. Retrieve memories (pre-model)
   - If `!temporaryChat` and `userId`:
     - Extract last user text (already available for trimming logic).
     - `const memories = await searchMemories({ userId, query: lastUserText, topK: 5, threadId });`
     - `const systemMemory = formatMemoriesForSystemPrompt(memories);`
     - If non-empty, prepend a `system` message to the message list before conversion.

3. Invoke model (unchanged streaming path)
   - Keep trimming/token budgeting.
   - Keep mixed content parts (text + images) for the last user message.

4. Write memories (post-user message)
   - If `!temporaryChat` and `userId`:
     - `await upsertMemory({ userId, text: lastUserText, threadId });`
   - (Optional enhancement) Also extract/update memory from the assistant’s response if useful (e.g., “We agreed to use ISO dates”).

5. Error handling and resilience
   - mem0 failures must not break chat; log and continue without memory.
   - Wrap calls with try/catch and observability hooks.

---

## 6) Client Hooks & Flags

- Temporary Chat
  - Add a client state for the top-right “Temporary chat” icon.
  - Pass `temporaryChat` in the `sendMessage(..., { body })` options so `/api/chat` can respect it.

- Future: Memory Controls
  - Commands like “remember this” or “forget X” can be detected client-side and sent via a dedicated `/api/memory` endpoint, or handled implicitly in `/api/chat`.

---

## 7) Security & Privacy

- Only associate memories with authenticated `userId`.
- Allow users to opt-out (temporary chat) and, later, manage/remove/export memories.
- Avoid storing sensitive credentials or secrets in memory.
- Rate-limit memory writes per user to prevent abuse.

---

## 8) Testing Plan

Unit/Integration:
- Mock mem0 responses and verify:
  - Retrieval is called with correct `userId`, query, and `topK`.
  - System prompt includes formatted memories when present.
  - Upsert is called after user message (and is skipped for temporary chat).

Manual scenarios:
- Signed-in user asks related questions across sessions → personalization persists.
- Toggle temporary chat on → no personalization, and nothing is written.
- Upload documents, then ask to “use the same brief” → memory recall triggers.
- Multi-language preference remembered across chats.

Performance:
- Ensure retrieval timeouts do not delay streaming start significantly.
- Confirm token budget remains safe after adding system memory preamble.

---

## 9) Step-by-step Implementation Checklist

1. Env & Config
   - Add `MEM0_API_KEY`, `MEM0_BASE_URL` and load with `process.env`.

2. Library
   - Create `src/lib/memory.ts` with `searchMemories`, `upsertMemory`, `deleteMemory`, `formatMemoriesForSystemPrompt`.

3. API Wiring
   - In `/api/chat`, get `userId` (Clerk), `temporaryChat` flag, and `threadId`.
   - Retrieve memories and prepend a `system` message when available.
   - After sending user message, upsert memory with tags.

4. Client Flag
   - Add `temporaryChat` state (icon toggle) and pass it in `sendMessage(..., { body })`.

5. QA & Logging
   - Gracefully handle mem0 errors and add lightweight logs for visibility.

6. Future Enhancements
   - “Remember/Forget” commands, memory viewer UI, export, and fine-grained categories.

---

## 10) Example Pseudocode (Server)

```ts
// inside /api/chat/route.ts
import { auth } from "@clerk/nextjs/server"
import { searchMemories, upsertMemory, formatMemoriesForSystemPrompt } from "@/lib/memory"

const { userId } = auth()
const { messages, model, attachments, temporaryChat } = await req.json()

const lastUserText = extractLastUserText(messages)
let systemMemory = ""

if (userId && !temporaryChat && lastUserText) {
  try {
    const mems = await searchMemories({ userId, query: lastUserText, topK: 5 })
    systemMemory = formatMemoriesForSystemPrompt(mems)
  } catch {}
}

const uiMsgs: any[] = []
if (systemMemory) uiMsgs.push({ role: "system", content: systemMemory })
uiMsgs.push(...buildUiMessagesWithParts(messages, attachments))

const result = await streamText({ model: google(resolveModel(model)), messages: convertToModelMessages(uiMsgs) })

// fire-and-forget write
if (userId && !temporaryChat && lastUserText) {
  upsertMemory({ userId, text: lastUserText }).catch(() => {})
}
```

---

## 11) Rollout Plan

- Phase 1: Retrieval-only (read memories and inject into system prompt).
- Phase 2: Add upsert writes after each user message.
- Phase 3: Temporary chat toggle (skip read/write).
- Phase 4: Memory management commands and UI.


