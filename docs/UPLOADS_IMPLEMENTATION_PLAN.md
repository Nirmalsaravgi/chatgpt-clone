## File & Image Uploads — Implementation Plan

This plan describes how we will add file and image uploads to the chat experience, wire them through storage, and feed them to the model via Vercel AI SDK. It is designed to be incremental and to match ChatGPT’s UX closely.

### Goals
- Attach files and images from the composer (click, drag-and-drop, paste).
- Preview attachments before sending; allow removal.
- Upload to cloud storage (Uploadcare or Cloudinary) and send stable URLs to the model.
- Render attachments (thumbnails/links) in the transcript.
- Respect model context window and size limits; gracefully handle oversize files.

---

## Architecture Overview

1) Client (composer/UI)
- Add a hidden `<input type="file">` triggered by the Attach button, plus drag-and-drop and clipboard paste.
- Stage selected files in component state as “pending attachments” (name, size, mime, preview URL for images).
- On Send:
  - If files exist, upload them first via `POST /api/uploads` using `FormData`.
  - Replace pending attachments with uploaded file descriptors (public URL, mime, dimensions if image).
  - Call `useChat.sendMessage({ text, files: [...] })` or add message `parts` that reference these URLs.

2) API: `/api/uploads`
- Accept multipart `FormData` (field name: `files[]`).
- Validate type & size; reject disallowed types; cap total payload size.
- Upload to storage provider (choose one, see Provider section below) and return normalized file descriptors:
  ```json
  {
    "files": [
      {
        "url": "https://cdn.example.com/abc.jpg",
        "name": "abc.jpg",
        "mime": "image/jpeg",
        "size": 123456,
        "width": 1024,
        "height": 768
      }
    ]
  }
  ```

3) API: `/api/chat` (existing)
- Extend current body to optionally include `attachments` (array of file descriptors) for the last user turn.
- Convert to model messages using Vercel AI SDK UI message `parts`:
  - Images: `{ type: 'image', image: { url: '...' } }` (or DataContent when needed).
  - Documents: `{ type: 'resource', resource: { uri: '...', mimeType: 'application/pdf' } }`.
- Keep accurate token budgeting (already implemented) and account for light per-attachment overhead in the budget.

4) Transcript rendering
- For user turns with attachments, render chips:
  - Images: small preview thumbnail; on click, open full-size.
  - Files: icon by type + filename + size; on click, open URL in new tab.
- For assistant responses that include returned links or generated images (future), render similarly.

---

## Provider Choice

Either provider works; pick one first for speed.

### Option A: Uploadcare (Fast to start)
- Pros: Simple public URLs, built-in transformations, client-side upload option later.
- Env: `UPLOADCARE_PUBLIC_KEY`, optional secret for signed operations.
- Flow: Server receives `FormData`, uses Uploadcare REST (or multipart direct) → returns CDN URL.

### Option B: Cloudinary (Popular)
- Pros: Widely used, strong image/video transforms, signed uploads.
- Env: `CLOUDINARY_URL` (or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
- Flow: Server receives `FormData`, uploads via Cloudinary SDK → returns secure URL + metadata.

We will implement one provider behind an internal abstraction so switching is easy later.

---

## Data Contracts

### Client → `/api/uploads` (multipart)
- Field: `files[]` (one or multiple)

### `/api/uploads` → Client (JSON)
```json
{
  "files": [
    { "url": "string", "name": "string", "mime": "string", "size": 12345, "width": 0, "height": 0 }
  ]
}
```

### Client → `/api/chat` (JSON)
```json
{
  "messages": [...],
  "model": "models/gemini-2.5-flash-lite",
  "attachments": [
    { "url": "string", "name": "string", "mime": "string", "size": 12345, "width": 0, "height": 0 }
  ]
}
```

### `/api/chat` handling
- For the new user message:
  - Convert `attachments` to UI message `parts` before calling `convertToCoreMessages`:
    - Images → `parts.push({ type: 'image', image: { url } })`
    - Non-images → `parts.push({ type: 'resource', resource: { uri: url, mimeType: mime } })`
- Send to `streamText(google(model))` as usual.

---

## UI/UX Details

### Composer
- Attach button opens file picker (accept multiple).
- Drag-and-drop overlay over composer; highlight on dragover.
- Paste image from clipboard produces a staged image.
- Show staged items as compact chips:
  - Image chip: thumbnail + remove (×)
  - File chip: icon + filename + size + remove (×)
- Send button disabled while uploads in-flight; send only after upload success.

### Transcript
- Right-aligned user bubbles render chips inline above the message text.
- Clicking a chip opens the asset (new tab) or a lightbox for images (optional enhancement).

### Errors & Limits
- Validate before upload (max size per file, count limit, type whitelist: images (png,jpg,jpeg,webp), pdf, docx, txt, md).
- On error, show inline chip error state and allow removal/retry.
- If attachments are too large for the model context (rare; URLs are small), still send the text and include links; model can fetch when supported.

---

## Security
- Accept only known, safe mime types.
- Enforce server-side size limits.
- Strip/ignore metadata we don’t need; do not echo untrusted filenames to the DOM without escaping.
- Ensure upload endpoint is rate-limited (middleware or platform settings) and behind CSRF protections if needed.

---

## Step-by-Step Tasks

1) Storage provider setup
- Pick Uploadcare or Cloudinary. Add env keys in `.env.local`. Create `src/lib/uploads.ts` with provider-specific `uploadFiles(formData: FormData): Promise<UploadedFile[]>`.

2) API: `/api/uploads`
- Edge is not required (Node runtime ok). Parse `FormData`, call `uploadFiles`, return JSON descriptors.

3) Client: composer staging
- Add state for `pendingAttachments` in `Conversation` composer.
- Wire Attach button / drag-and-drop / paste to populate `pendingAttachments`.
- On submit: call `/api/uploads`; replace with uploaded descriptors; then call `sendMessage({ text, files })` or add `parts` accordingly.

4) API: `/api/chat` augmentation
- If `attachments` present in request body, transform the last user message into UI message with `parts` for each attachment before `convertToCoreMessages`.

5) Transcript rendering
- Render chips for attachments in user bubbles; thumbnails for images.

6) Polishing
- Loading indicators on chips during upload; retry on failure; size/type tooltips; lightbox for images (future).

---

## Minimal Schema

```ts
// src/types/uploads.ts
export type UploadedFile = {
  url: string
  name: string
  mime: string
  size: number
  width?: number
  height?: number
}
```

---

## Rollout Strategy
- Phase 1: Uploadcare (fastest) + image/pdf/txt support, chips in composer and transcript.
- Phase 2: Cloudinary parity or switch via the same abstraction.
- Phase 3: Drag/drop/paste polish, lightbox, and model-grounded tools for file QA.

---

## Testing Checklist
- Pick 3 file types (jpg, pdf, txt) and validate full flow: select → upload → send → render.
- Oversize file rejection shows clear message and allows removal.
- Slow network: uploads don’t deadlock the composer; errors are actionable.
- Model receives messages with `parts` and responds normally.


