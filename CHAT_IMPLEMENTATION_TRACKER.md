## Chat Implementation Tracker (Vercel AI SDK + Google Models)

Status legend: [ ] TODO  [~] In Progress  [x] Done

### 1) Dependencies & Env
- [x] Install `ai`, `@ai-sdk/google`
- [x] Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local`
- [x] Install `gpt-tokenizer` for accurate token counts

### 2) Model Config
- [x] `lib/models.ts`: model map, resolver, budgets (default: `models/gemini-2.5-flash-lite`)

### 3) Context Trimming
- [x] `lib/context.ts`: accurate token-based `trimToBudget(messages, { maxInputTokens, reserveForResponse, systemPrompt })`

### 4) Streaming API Route
- [x] `app/api/chat/route.ts`: streaming with `streamText(google(model))`, trims history first, returns streaming response (text stream)

### 5) Client Streaming UI
- [x] `Conversation` uses `useChat` + `TextStreamChatTransport`
- [x] Continuous thread, Enter-to-send, Send button, streaming guard
- [x] Assistant Markdown rendering (GFM + highlight) + `.markdown` styles

### 6) UX & Resilience
- [ ] Typing indicator, stop/regenerate button, error toasts
- [ ] Persist chats & restore

### Notes
- Trimming prefers newest messages and keeps within `(maxInputTokens - reserveForResponse)` with small per-message overhead.
- Replace summarization for dropped context in a later iteration.

