# Man Yage Uri V1 Milestone 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the preview flow so users can select a next-story direction, move to a checkout preparation screen, and give developers a Supabase SQL schema for the V1 data model.

**Architecture:** Keep the milestone dependency-free by using the existing in-memory store and narrow API routes. The store gains story statuses and selected-choice persistence, the UI calls a select-choice API, and SQL lives under `supabase/migrations` for later application once Supabase credentials are available.

**Tech Stack:** Next.js App Router, TypeScript, Zod, Vitest, Supabase SQL.

---

## File Structure

- `src/lib/story/schema.ts`: add stored story status and selected-choice response schemas.
- `src/lib/story/store.ts`: persist selected choice and status transition.
- `src/lib/story/store.test.ts`: unit tests for choice persistence.
- `src/app/api/story/select-choice/route.ts`: API for selecting a next direction.
- `src/app/api/story/[id]/route.ts`: API for loading a story by ID.
- `src/app/stories/[id]/preview/page.tsx`: pass story data to a client component.
- `src/app/stories/[id]/preview/choice-actions.tsx`: client choice buttons that call the API.
- `src/app/checkout/[storyId]/page.tsx`: checkout preparation page for the five-episode product.
- `supabase/migrations/202605140001_v1_schema.sql`: V1 database schema.

## Task 1: Store Status And Choice Persistence

**Files:**
- Modify: `src/lib/story/schema.ts`
- Modify: `src/lib/story/store.ts`
- Create: `src/lib/story/store.test.ts`

- [ ] **Step 1: Write failing store tests**

Test that saving a preview story starts as `preview_ready`, selecting choice `B` changes status to `choice_selected`, and invalid choice IDs are rejected.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm.cmd test`

Expected: fails because `selectStoryChoice` and `status` do not exist yet.

- [ ] **Step 3: Implement status and selection**

Add `StoryStatusSchema`, `selectedChoiceId`, `status`, and `selectStoryChoice(storyId, choiceId)`.

- [ ] **Step 4: Run tests**

Run: `npm.cmd test`

Expected: all tests pass.

## Task 2: Story APIs

**Files:**
- Create: `src/app/api/story/select-choice/route.ts`
- Create: `src/app/api/story/[id]/route.ts`

- [ ] **Step 1: Implement choice API**

Validate `{ storyId, choiceId }`, call `selectStoryChoice`, and return HTTP 404 for unknown story or invalid choice.

- [ ] **Step 2: Implement story lookup API**

Return the stored story payload from `GET /api/story/[id]`; return 404 if missing.

## Task 3: Choice UI And Checkout Preparation

**Files:**
- Modify: `src/app/stories/[id]/preview/page.tsx`
- Create: `src/app/stories/[id]/preview/choice-actions.tsx`
- Create: `src/app/checkout/[storyId]/page.tsx`

- [ ] **Step 1: Create client choice actions**

Render three buttons, call `/api/story/select-choice`, show errors, and route to `/checkout/{storyId}`.

- [ ] **Step 2: Wire preview page**

Replace static choice buttons with `ChoiceActions`.

- [ ] **Step 3: Create checkout preparation page**

Show the five-episode complete product, price placeholder, selected choice, and a disabled Toss payment CTA labeled for the next milestone.

## Task 4: Supabase Schema

**Files:**
- Create: `supabase/migrations/202605140001_v1_schema.sql`

- [ ] **Step 1: Add schema SQL**

Create enum types for story status and payment status, then create `story_inputs`, `stories`, `story_chapters`, `story_choices`, `payments`, `moderation_logs`, `prompt_versions`, `admin_users`, and `data_deletion_requests`.

- [ ] **Step 2: Add indexes and constraints**

Add foreign keys, unique constraints for story chapter numbers and choice IDs, amount checks, and useful status indexes.

## Task 5: Verify

**Files:**
- Modify as needed based on verification output.

- [ ] **Step 1: Run tests**

Run: `npm.cmd test`

Expected: all tests pass.

- [ ] **Step 2: Run build**

Run: `npm.cmd run build`

Expected: Next.js build succeeds.

- [ ] **Step 3: Browser-check the flow**

Open `http://localhost:3000`, create a preview, click a next choice, and confirm `/checkout/{storyId}` renders.

## Self Review

- This milestone does not add production dependencies.
- It prepares Supabase SQL without requiring credentials.
- It moves the product flow one step closer to payment while keeping Toss disabled until the payment milestone.
