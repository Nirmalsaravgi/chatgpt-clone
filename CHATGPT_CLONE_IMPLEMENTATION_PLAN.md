## ChatGPT Clone — Implementation Plan

### Goal & Scope
- Build a pixel-perfect, production-ready ChatGPT clone with identical UI/UX and behavior.
- Include: chat streaming via Vercel AI SDK, conversation memory (mem0), message editing with regeneration, long-context handling, file/image uploads, mobile responsiveness, accessibility, and a Next.js backend with MongoDB, Cloudinary, Uploadcare, Clerk, and webhooks.
- Follow technical guidelines in `projectGuideLines.txt` and functional requirements in `projectGoal.txt`.

### References To Match ChatGPT Precisely
- Capture UI tokens directly from ChatGPT using browser DevTools:
  - Typography: font family, sizes, weights, letter-spacing, line-heights.
  - Spacing: paddings, margins, gaps (px) for navbar, sidebar, chat list, messages, composer.
  - Layout: column widths, breakpoints, sidebar width, message max-width, container paddings.
  - Components: message bubbles, code blocks, buttons, menus, modals, tooltips.
  - Interactions: hover states, focus rings, pressed/active, selection, drag-and-drop.
  - Animations: durations, easings, opacity/transform keyframes for stream-in, fade, slide.
  - Scroll behavior: auto-scroll on stream, stick-to-bottom threshold, smooth overscroll.
  - Chat behaviors: typing indicator, “Stop generating”, “Regenerate”, “Continue generating”, “Edit message”.
- Produce a design token sheet with exact values to drive Tailwind config and component styles.

### Tech Stack (as mandated)
- Framework: Next.js (App Router), TypeScript
- Styling: TailwindCSS + ShadCN UI (component primitives)
- AI: Vercel AI SDK (`ai` / `@ai-sdk/react`)
- Auth: Clerk
- DB: MongoDB (Atlas)
- Memory: mem0
- Upload UI: Uploadcare
- Storage: Cloudinary
- Deploy: Vercel

### High-Level Architecture
- Next.js App Router for pages and API route handlers.
- Server components for shells; client components for interactive chat UI.
- API routes under `app/api/*` for chat, uploads, webhooks.
- Vercel AI SDK server handler streams tokens to the client via SSE.
- MongoDB for users, conversations, messages, memory entries, and file metadata.
- mem0 used to extract and retrieve user-specific memories on each conversation turn.
- Uploadcare for client-side upload; store resulting assets in Cloudinary; persist metadata in MongoDB.
- Clerk protects app routes and associates data with `userId`.

### Directory Structure
```text
src/
  app/
    (app)/layout.tsx
    page.tsx
    api/
      chat/route.ts
      uploads/route.ts
      webhooks/
        cloudinary/route.ts
        uploadcare/route.ts
  components/
    chat/
      ChatLayout.tsx
      Sidebar.tsx
      ConversationList.tsx
      ChatView.tsx
      MessageItem.tsx
      MessageActions.tsx
      CodeBlock.tsx
      AttachmentPreview.tsx
      TypingIndicator.tsx
      Composer.tsx
    ui/ (shadcn components)
  lib/
    db.ts
    auth.ts
    ai.ts
    tokenizer.ts
    memory.ts
    cloudinary.ts
    uploadcare.ts
    telemetry.ts
  styles/
    globals.css
```

### Data Model
- Users (via Clerk; minimal local projection if needed)
- Conversations: { _id, userId, title, createdAt, updatedAt, model, settings }
- Messages: { _id, conversationId, role: "system"|"user"|"assistant", content, parts, attachments, tokenCounts, createdAt, editedFromMessageId? }
- Attachments: { _id, messageId, type: "image"|"file", filename, mime, size, url, storage: "cloudinary", metadata }
- Memories: { _id, userId, key, value, createdAt, score }
- Webhooks: logs of inbound events if needed

### UI/UX Parity Plan
- Shell
  - Left sidebar: New chat button, conversation list with hover/active states, foldering (optional), scrollbar styling, collapse on mobile.
  - Top bar: Model selector, title, user menu (settings, help), responsive behavior.
  - Main: Chat surface with message max-width, centered column, subtle background pattern.
- Messages
  - Roles: assistant vs user visual styles, avatars, bubble widths, code blocks with copy, markdown rendering identical to ChatGPT (headings, lists, tables, math, images).
  - Hover actions: copy, like/dislike (optional), edit (for user message), regenerate (for assistant message), continue.
  - Streaming: token-by-token appearance, caret/typing indicator, auto-scroll with pause on scroll-up.
- Composer
  - Multiline TextArea, Shift+Enter for newline, Enter to send.
  - Attachments: drag-and-drop, paste, file/image button; previews; remove.
  - Buttons: Send, Stop/Cancel while streaming; disabled states.
- Modals/Popovers
  - Model switcher with options and descriptions.
  - Settings: theme, message display density, advanced toggles.
- Accessibility
  - Full keyboard navigation, focus management, ARIA labels, screen-reader announcements during stream.

### Chat Flow (Server + Client)
1. Client sends: { conversationId, messages[], attachments[], model, settings } to `/api/chat`.
2. Server assembles context:
   - Retrieves last N messages trimmed to model token limit.
   - Pulls relevant mem0 facts for userId.
   - Injects system prompt to match ChatGPT behavior (tone, formatting, safety).
3. Server streams completion via Vercel AI SDK; yields delta tokens.
4. Client renders streaming text, manages auto-scroll, exposes Stop button.
5. On finish:
   - Persist assistant message, token counts, attachments.
   - Update conversation title if first assistant message (auto-summarize).

### Long-Context Handling
- Implement sliding window with token-aware trimming.
- Use tokenizer util to count tokens for messages and system prompt.
- Strategy: keep most recent exchanges; summarize older context into brief memory messages when needed.

### Memory (mem0)
- Extract key facts after each user message and store in mem0.
- Retrieve top-k memories for userId and inject into system context.
- Decay/score to avoid stale memories; allow clearing via settings.

### Message Editing & Regeneration
- When user edits a prior user message:
  - Fork conversation at edit point; mark subsequent assistant messages as invalidated.
  - Send edited history to `/api/chat` and stream a new assistant response.
- Regenerate: re-run last assistant turn with same prior user message and context.
- Continue generating: call API to continue from last response with a continuation prompt.

### File & Image Uploads
- Uploadcare widget for client uploads (drag-drop, paste, button).
- On success, move file to Cloudinary (server) or direct-store via signed upload.
- Persist attachment metadata; include references in prompt context (for images: vision-capable models when enabled; for docs: extract text server-side if needed).

### Webhooks
- Receive Uploadcare/Cloudinary events for processing (e.g., virus scan result, OCR completion, thumbnail generation).
- Update attachment metadata and notify client if necessary.

### API Routes
- `POST /api/chat`: stream assistant messages (Vercel AI SDK)
- `POST /api/uploads`: handle server-side file handoff/signing and metadata persistence
- `POST /api/webhooks/cloudinary`: process storage events
- `POST /api/webhooks/uploadcare`: process upload events

### Environment Variables
- Clerk: CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
- MongoDB: MONGODB_URI, MONGODB_DB
- Vercel AI SDK / Provider: OPENAI_API_KEY (or provider keys)
- Cloudinary: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Uploadcare: UPLOADCARE_PUBLIC_KEY, UPLOADCARE_SECRET_KEY
- App: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_UPLOAD_LIMITS, MEM0_API_KEY

### Implementation Milestones
- Milestone 1: Project setup
  - Next.js + TS + Tailwind + ShadCN; base layout; Clerk auth; Mongo connection; env wiring.
- Milestone 2: UI Shell Parity
  - Sidebar, top bar, containers, responsive styles; theme and density settings.
- Milestone 3: Chat Core
  - Composer, message list, streaming via `/api/chat`, auto-scroll, stop/regenerate.
- Milestone 4: Message Rich Rendering
  - Markdown, code blocks with copy and syntax highlighting, tables, math, images.
- Milestone 5: Uploads
  - Uploadcare integration, previews; Cloudinary storage; attachment persistence.
- Milestone 6: Memory
  - mem0 integration; extraction and retrieval in server flow.
- Milestone 7: Message Editing & Branching
  - Edit user message, fork conversation, regenerate flows.
- Milestone 8: Long-Context Controls
  - Token-aware trimming and summarization; model selector constraints.
- Milestone 9: Webhooks and Background Processing
  - Uploadcare/Cloudinary webhooks; metadata updates.
- Milestone 10: Polish & QA
  - Accessibility, pixel-perfect passes, cross-browser/mobile, telemetry, error boundaries.
- Milestone 11: Deploy
  - Vercel CI/CD, envs, production checks.

### Validation & Testing
- Visual regression: Playwright screenshots compared against captured ChatGPT references.
- Interaction tests: streaming, stop, regenerate, edit, continue, auto-scroll edge cases.
- Uploads: drag-drop, paste, large files, mime edge cases, retry flows.
- Token limits: forced trimming scenarios with assertions on preserved recency.
- Accessibility: keyboard-only runs, screen-reader announcements during stream.

### Performance Considerations
- Virtualize long message lists; lazy-load heavy components (code highlighter).
- Stream rendering is chunked; avoid reflow by batching updates.
- Cache conversation list; optimistic UI for new chat.
- Use CDN-transformed Cloudinary assets for previews.

### Security & Compliance
- Clerk-protected routes; server-side auth checks on every API route.
- File validation (size/mime) server-side; signed Cloudinary uploads.
- Rate limiting on `/api/chat`.
- Secrets isolated in server; never expose provider keys.

### Developer Workflow
- Use Cursor and ShadCN generator for consistent components.
- Tailwind tokens derived from ChatGPT reference sheet; avoid magic numbers in components.
- Strict TypeScript; shared types for Message, Conversation, Attachment, Memory.
- Prettier/ESLint aligned with Next.js best practices.

### Setup Steps
1. Initialize project with Next.js App Router + TS. Install Tailwind, ShadCN.
2. Configure Clerk provider and middleware; protect app routes.
3. Connect MongoDB and define models.
4. Add Vercel AI SDK; implement `/api/chat` streaming handler.
5. Build UI shell (sidebar/top bar) matching captured tokens.
6. Implement chat surface, message rendering, composer, controls.
7. Integrate Uploadcare (client) and Cloudinary (server) with metadata persistence.
8. Add mem0 integration for post-turn extraction and pre-turn retrieval.
9. Implement edit/regenerate/continue flows and conversation branching.
10. Add tokenizer-based context trimming and summarization.
11. Implement webhooks for uploads/storage.
12. QA passes, visual regression, accessibility; deploy to Vercel.

### Definition of Done
- Pixel-perfect UI/UX matching ChatGPT on desktop and mobile.
- Functional streaming chat with memory, uploads, edit/regenerate, long-context handling.
- Backend integrated with MongoDB, Cloudinary, Uploadcare, Clerk, webhooks.
- Deployed on Vercel with complete README and environment setup.
