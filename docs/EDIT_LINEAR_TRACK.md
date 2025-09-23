## Edit (Linear) – Truncate and Continue (Implementation Tracker)

### Goal
Allow editing any prior user query. On submit: delete that message and all that follow in the thread, then continue from the edited text linearly.

### Current State (before)
- Linear chat per thread; messages persisted in Mongo via `/api/chat`.
- Retrieval via `/api/threads/:id/messages` cron-sorted.
- mem0 memory injected on server.

### Tasks
1) Server: `POST /api/messages/:id/edit-linear` [IN PROGRESS]
2) Client: Minimal edit UI in `Conversation.tsx` [PENDING]
3) Client: Clear local state post-truncate; re-fetch, then send edited text [PENDING]

### API Contract
- Request: `POST /api/messages/:id/edit-linear` body `{ text: string }`.
- Behavior: Auth check, find message, delete that and all later messages (`createdAt >= target.createdAt`) in same thread, update thread timestamps, return `{ threadId }`.

### Notes
- We let `/api/chat` persist the edited text; the edit endpoint only truncates.
- Optional: update thread title to the edited text slice.


