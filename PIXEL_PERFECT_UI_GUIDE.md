## Pixel-Perfect ChatGPT UI — Practical Workflow

This guide explains exactly how we'll match ChatGPT's UI/UX with precision and verify it.

### 1) Capture Source-of-Truth From ChatGPT
- Open ChatGPT in Chrome and use DevTools on key screens and states:
  - Default empty chat, active chat with multiple messages, with code blocks, long tables, images, streaming state, editing state, sidebar expanded/collapsed, narrow mobile view.
- For each element, capture:
  - Computed CSS (font-family, font-size, font-weight, line-height, letter-spacing, color, background, border, radius, box-shadow).
  - Box model (content size, padding, margin, gap).
  - Layout constraints (max-widths, min-heights, breakpoints, flex/grid usage).
  - Animation timings and easings (from Styles > @keyframes and computed transitions).
- Record exact pixel values. Convert to rem later using the page base font-size (usually 16px).

### 2) Build a Token Sheet From Measurements
- Create a tokens sheet (internal doc or JSON) with exact names/values:
  - Colors: background, foreground, subtle borders, mutes, link, code, mentions, selection.
  - Typography: sizes, weights, line-heights, letter-spacing.
  - Spacing: 2, 4, 6, 8, 12, 16, 20, 24, ... matched to measured paddings/margins.
  - Radii/shadows: card, popover, tooltip, bubble, composer, buttons.
  - Layout: sidebar width, chat max-width, container paddings, header height.
  - Z-index: nav, popover, tooltip, modal, toasts.
  - Animation: durations and easings for fade/slide/scale, streaming caret blink.

### 3) Map Tokens Into Tailwind + ShadCN
- Tailwind: define tokens in `tailwind.config.js` under `theme.extend`.
  - colors, spacing, fontSize, fontWeight, lineHeight, letterSpacing, borderRadius, boxShadow, zIndex, transitionTimingFunction, transitionDuration.
- ShadCN: generate primitives, then override to use Tailwind token classes and CSS vars.
- Globals: set `html { font-size: <measured-base>; } body { font-family: <matched-stack>; }`.

### 4) Component Specs (Key Targets)
- Sidebar
  - Width: match px; collapsible behavior; scrollbars; hover/active background; item spacing; icons stroke width.
- Top bar
  - Height, padding, title font, model switcher spacing, user menu popover.
- Chat surface
  - Max-width container centered; background pattern/subtle grid if present; spacing between turns.
- Message items
  - Bubble padding, radius, background colors (assistant vs user), avatar size, metadata row spacing.
  - Markdown styles for headings, lists, tables, blockquotes; link colors; inline code styles.
  - Code blocks: font, size, line-height, background, border, radius, copy button placement, language pill.
- Composer
  - Textarea min/max height, padding, placeholder style; attachment buttons; send/stop states; disabled visuals.
- Popovers/Modals/Tooltips
  - Shadow depth, radius, padding, caret arrows if any; open/close animation timings.

### 5) Behavior Parity (Micro-Interactions)
- Streaming
  - Token-by-token rendering cadence; caret blink; auto-scroll until user scrolls up; resume behavior.
- Actions on hover
  - Copy, regenerate, continue; focus/hover/active/focus-visible rings.
- Keyboard
  - Enter to send, Shift+Enter newline, Escape to close popovers, Tab order.
- Responsiveness
  - Breakpoints for sidebar collapse, composer resizing, message max-width adjustments.

### 6) Verification — Manual Pixel Overlay
- Take a full-page PNG screenshot of ChatGPT state (desktop/mobile).
- Add an overlay mode in our app (dev-only):
  - Toggle places a semi-transparent image on top of the UI with `mix-blend-difference` and adjustable opacity.
  - Align via container offsets until edges line up.
  - Fix any misaligned paddings, font sizes, radii, shadows.
- Alternatively use a Chrome extension (e.g., PerfectPixel) to overlay reference screenshots.

### 7) Verification — Automated Visual Regression
- Use Playwright to capture goldens of our app states.
- Use Pixelmatch (or Playwright’s toMatchSnapshot) with a strict threshold (e.g., <= 0.1% diff) against approved goldens captured from our overlay-aligned build.
- Include different DPI/viewport widths to cover desktop and mobile.

### 8) Implementation Order (UI First, Then Wiring)
1) Implement base shell (sidebar/top bar/main areas) to exact measurements.
2) Implement message list + rendering (markdown + code blocks) to spec.
3) Implement composer + interaction states.
4) Implement popovers/modals/tooltips.
5) Apply animations and micro-interactions.
6) Integrate streaming, memory, uploads.
7) Run overlay and visual regression; iterate until the diff is negligible.

### 9) Fonts & Icons
- Fonts: inspect ChatGPT’s font stack; replicate with equivalent commercially safe alternatives (e.g., Inter, system UI) if exact proprietary fonts are unavailable; adjust sizes/line-heights to match.
- Icons: pick a set with matching geometry and stroke (e.g., Lucide/Tabler/Phosphor). Tweak sizes/strokes for parity.

### 10) Accessibility Parity
- Use roles (`main`, `navigation`, `complementary`) and ARIA labels on composer and message list.
- Announce streaming updates via an aria-live region.
- Ensure focus outlines match measured styles and are keyboard visible.

### 11) Acceptance Criteria
- Manual overlay shows near-perfect alignment at key breakpoints.
- Snapshot diff <= 0.1% across covered states.
- All interactions behave identically (streaming, stop, regenerate, edit, continue, auto-scroll behavior).
