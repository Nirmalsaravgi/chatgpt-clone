ChatGPT Clone (Next.js)

This is a Next.js 15 app that replicates a ChatGPT-like experience with Google Gemini models, Clerk authentication, MongoDB thread/message persistence, Uploadcare file uploads, and Mem0 memory.

## Run locally

1) Install deps
```bash
npm install
```

2) Create `.env.local` at the project root with the variables below

3) Start the dev server
```bash
npm run dev
```

4) Visit `http://localhost:3000`

To build and run production locally:
```bash
npm run build && npm start
```

## Environment variables (.env.local)

Required for full functionality:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
UPLOADCARE_PUBLIC_KEY=
MEM0_API_KEY=
MONGODB_URI=
MONGODB_DB=
```

- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY: Clerk auth keys. Create an app in Clerk and copy the frontend (publishable) and backend (secret) keys.
- GOOGLE_GENERATIVE_AI_API_KEY: API key for Google AI Studio/Gemini (used via `@ai-sdk/google`).
- UPLOADCARE_PUBLIC_KEY: Uploadcare public key for file uploads (images and docs).
- MEM0_API_KEY: API key for Mem0 memory. If omitted, memory is disabled gracefully.
- MONGODB_URI: Connection string for MongoDB (e.g., Atlas). Required for threads and messages storage.
- MONGODB_DB: Database name to use in the cluster.

Place these in `.env.local` (not committed). The middleware uses Clerk, so these keys must be set in all environments (local and deploy).

## App routes (pages)

App router structure under `src/app`:

- `/` (Home): Signed-in users see the chat header (model switcher, temporary toggle) and landing area; signed-out users see `TopNav`, `WelcomeAuthPrompt`, and public landing.
- `/chat/[threadId]`: Full chat experience for a specific thread. Left `Sidebar` lists chats, right panel renders conversation (`ConversationClient`/`Conversation`).
- `/sign-in` and `/sign-up`: Clerk auth routes under `src/app/sign-in/[[...sign-in]]` and `src/app/sign-up/[[...sign-up]]`.
- `/log-in-or-create-account`: Friendly gate prompting users to authenticate.

API routes under `src/app/api`:
- `POST /api/chat`: Streams responses from Google Gemini; persists messages and threads for signed-in users; integrates attachments and memories.
- `GET /api/threads`: Lists user threads.
- `POST /api/threads`: Creates a new thread.
- `DELETE /api/threads/[id]`: Deletes a thread.
- `GET /api/threads/[id]/messages`: Lists messages for a thread.
- `POST /api/uploads`: Uploads files via Uploadcare and returns CDN URLs.

## Live deployment

Deployed at: https://chatgpt-clone-eight-swart.vercel.app/

On Vercel, set the same environment variables in Project Settings → Environment Variables. After setting/updating, redeploy.

## Notable tech

- Next.js 15 (App Router), React 19
- Clerk for auth (`src/middleware.ts` wires routes)
- MongoDB for threads/messages (`src/lib/db.ts`)
- Google Gemini via `@ai-sdk/google` and `ai` streaming
- Uploadcare for file uploads (`src/lib/uploads.ts`)
- Mem0 for semantic memory (`src/lib/memory.ts`)

## Development tips

- If sidebar scrolls with chat, ensure page layout uses `h-dvh` and the chat panel uses `overflow-y-auto` with `min-h-0` ancestors (already configured).
- To change default model, edit `MODEL_DEFAULT` in `src/lib/models.ts`.
- If MEM0 or UPLOADCARE are not configured, features degrade gracefully (memories/uploads may be limited or disabled).
