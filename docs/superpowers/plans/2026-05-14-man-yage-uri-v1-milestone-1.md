# Man Yage Uri V1 Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the initial Next.js app scaffold with a polished mobile-first landing page, guided input form, local moderation, mock preview generation, and story preview screen.

**Architecture:** This milestone keeps external services behind local adapters. The UI calls server routes, the routes validate with Zod, moderation runs deterministically, and mock generation returns schema-valid story JSON so the end-to-end user path can be tested before Supabase, OpenAI, and Toss credentials are connected.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Zod, Vitest, React Testing Library.

---

## File Structure

- `package.json`: scripts and dependencies.
- `next.config.ts`: Next.js config.
- `tsconfig.json`: TypeScript config.
- `vitest.config.ts`: test runner config.
- `src/app/layout.tsx`: global layout and metadata.
- `src/app/globals.css`: app-wide styling tokens.
- `src/app/page.tsx`: landing page.
- `src/app/create/page.tsx`: guided create form.
- `src/app/stories/[id]/preview/page.tsx`: preview page.
- `src/app/api/story/generate-preview/route.ts`: preview generation route.
- `src/lib/story/schema.ts`: Zod schemas and TypeScript types.
- `src/lib/story/moderation.ts`: deterministic safety checks.
- `src/lib/story/mock-generator.ts`: schema-valid local generator.
- `src/lib/story/store.ts`: temporary in-memory story store for milestone 1.
- `src/lib/story/moderation.test.ts`: moderation unit tests.
- `src/lib/story/schema.test.ts`: AI JSON contract tests.

## Task 1: Create Project Scaffold

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Add project metadata and scripts**

Create `package.json`:

```json
{
  "name": "man-yage-uri",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@next/font": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@testing-library/react": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "autoprefixer": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "jsdom": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Add TypeScript, Next, Tailwind, and Vitest config**

Create the config files with strict TypeScript settings, App Router support, Tailwind content paths, and a `jsdom` Vitest environment.

- [ ] **Step 3: Add base layout and global CSS**

Use Korean metadata, mobile-first viewport behavior, neutral typography, and CSS custom properties for background, foreground, accent, muted, border, danger, and success colors.

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: `node_modules` and `package-lock.json` are created.

## Task 2: Define Story Contracts

**Files:**
- Create: `src/lib/story/schema.ts`
- Create: `src/lib/story/schema.test.ts`

- [ ] **Step 1: Write schema tests**

Create tests that accept a valid preview response and reject responses missing `next_choices` or containing a non-episode-1 preview chapter.

- [ ] **Step 2: Implement Zod schemas**

Define `StoryInputSchema`, `PreviewStorySchema`, `NextChoiceSchema`, `ChapterSchema`, `SafetyFlagsSchema`, and exported TypeScript types.

- [ ] **Step 3: Run tests**

Run: `npm test -- src/lib/story/schema.test.ts`

Expected: schema tests pass.

## Task 3: Add Deterministic Moderation

**Files:**
- Create: `src/lib/story/moderation.ts`
- Create: `src/lib/story/moderation.test.ts`

- [ ] **Step 1: Write moderation tests**

Cover blocking for self-harm, stalking, threats, phone numbers, and passing for safe breakup reflection text.

- [ ] **Step 2: Implement moderation**

Return `{ allowed, categories, message, sanitizedInput }`. Block unsafe categories and redact phone-number-like values from sanitized input.

- [ ] **Step 3: Run tests**

Run: `npm test -- src/lib/story/moderation.test.ts`

Expected: moderation tests pass.

## Task 4: Build Mock Generator And Store

**Files:**
- Create: `src/lib/story/mock-generator.ts`
- Create: `src/lib/story/store.ts`

- [ ] **Step 1: Implement `generateMockPreview`**

Return a schema-valid title, summary, first chapter, and three next choices based on the user's selected emotion and desired ending.

- [ ] **Step 2: Implement in-memory store**

Expose `savePreviewStory(story)` and `getPreviewStory(id)`. Use `crypto.randomUUID()` for story IDs.

## Task 5: Add Preview Generation API

**Files:**
- Create: `src/app/api/story/generate-preview/route.ts`

- [ ] **Step 1: Validate request JSON**

Parse request body with `StoryInputSchema.safeParse`.

- [ ] **Step 2: Run moderation**

If moderation blocks, return HTTP 400 with the moderation message and categories.

- [ ] **Step 3: Generate and store preview**

Call `generateMockPreview`, validate the result with `PreviewStorySchema`, store it, and return `{ storyId, story }`.

## Task 6: Build User Flow UI

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/create/page.tsx`
- Create: `src/app/stories/[id]/preview/page.tsx`

- [ ] **Step 1: Build landing page**

Create a mobile-first page with product positioning, sample promise, safety framing, and a clear `/create` CTA.

- [ ] **Step 2: Build create form**

Create a guided form for breakup moment, reason, alternative choice, emotion, desired ending, protagonist alias, partner alias, AI fiction agreement, and privacy agreement.

- [ ] **Step 3: Submit to API**

On submit, call `/api/story/generate-preview`, handle validation/moderation errors, and navigate to `/stories/{storyId}/preview`.

- [ ] **Step 4: Build preview page**

Load the story by ID from the temporary store and render title, summary, first chapter, ending hook, next choices, and a disabled checkout CTA labeled as the next milestone.

## Task 7: Verify Milestone

**Files:**
- Modify as needed based on test or build output.

- [ ] **Step 1: Run unit tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: Next.js build succeeds.

- [ ] **Step 3: Start dev server**

Run: `npm run dev`

Expected: local app is available at `http://localhost:3000`.

## Self Review

- This milestone covers the first product loop up to preview generation.
- Real Supabase, OpenAI, and Toss integration are intentionally deferred to later milestones through adapters.
- No placeholders remain in the implemented milestone scope.
- The plan gives concrete files, commands, and expected verification results.
