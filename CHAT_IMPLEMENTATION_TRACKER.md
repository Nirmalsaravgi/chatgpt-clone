## Chat Implementation Tracker (Vercel AI SDK + Google Models)

Status legend: [ ] TODO  [~] In Progress  [x] Done

### 1) Dependencies & Env
- [x] Install `ai` and `@ai-sdk/google`
- [ ] Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local`

### 2) Model Config
- [ ] `lib/models.ts`: model map and resolver

### 3) Context Trimming
- [ ] `lib/context.ts`: trimToBudget(messages, budget)

### 4) Streaming API Route
- [ ] `app/api/chat/route.ts`: streaming with `streamText` and Google provider

### 5) Client Streaming UI
- [ ] Refactor `Conversation` to `useChat({ api: "/api/chat" })`
- [ ] Hook model from `ModelSwitcher` (URL/store) to API body

### 6) UX & Resilience
- [ ] Loading indicator, stop, errors, retry/regenerate

### Notes
- Start with heuristic token budgeting, upgrade to tokenizer counts later
- Summarization of dropped context is a later enhancement


