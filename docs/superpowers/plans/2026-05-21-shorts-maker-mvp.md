# Shorts Maker MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an internal `/shorts-maker` tool that generates Korean short-form scripts, subtitles, promotional captions, hashtags, CTAs, storyboards, and review checklists for `성경통독 거치대야`.

**Architecture:** Add an isolated Next.js App Router page plus a server API route. Keep validation and generation logic under `src/lib/shorts` so it is testable without touching the existing story feature.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, OpenAI SDK already present in the repository, Vitest.

---

## File Structure

- Create `src/lib/shorts/schema.ts` for Zod input/output schemas and exported TypeScript types.
- Create `src/lib/shorts/mock-shorts-generator.ts` for deterministic local/demo generation.
- Create `src/lib/shorts/shorts-generator.ts` for prompt construction, status copy guardrails, and OpenAI/mock dispatch.
- Create `src/lib/shorts/shorts-generator.test.ts` for focused schema and generation tests.
- Create `src/app/api/shorts/generate/route.ts` for POST generation.
- Create `src/app/shorts-maker/page.tsx` for the internal UI.

## Task 1: Shorts Schemas

**Files:**
- Create: `src/lib/shorts/schema.ts`
- Test: `src/lib/shorts/shorts-generator.test.ts`

- [ ] **Step 1: Add schema definitions**

Create Zod enums for product status, audience, purpose, length, and tone. Export `shortsMakerInputSchema`, `shortsPackageSchema`, `ShortsMakerInput`, and `ShortsPackage`.

- [ ] **Step 2: Add schema tests**

Test that valid input parses, invalid status fails, and a complete mock-shaped output parses.

- [ ] **Step 3: Run focused tests**

Run: `npm.cmd test -- src/lib/shorts/shorts-generator.test.ts`

Expected before implementation may fail if dependent files are missing; after implementation it must pass.

## Task 2: Mock Generator and Guardrails

**Files:**
- Create: `src/lib/shorts/mock-shorts-generator.ts`
- Modify: `src/lib/shorts/shorts-generator.test.ts`

- [ ] **Step 1: Implement deterministic mock output**

Return a full `ShortsPackage` tailored to the selected input enough for demos and tests.

- [ ] **Step 2: Add launch-status guardrail helpers**

Expose `getAllowedStatusPhrase(input)` and `assertNoUnsafeLaunchClaims(package, input)` from `shorts-generator.ts`.

- [ ] **Step 3: Test status wording**

Assert that non-launched statuses do not produce `정식 출시 완료`, `다운로드 가능`, or `(주)씨엔에이 명의 등록 완료`.

## Task 3: API Route

**Files:**
- Create: `src/app/api/shorts/generate/route.ts`
- Modify: `src/lib/shorts/shorts-generator.ts`

- [ ] **Step 1: Implement `generateShortsPackage(input)`**

Use mock output when OpenAI is mocked or unavailable. Use OpenAI JSON generation when enabled.

- [ ] **Step 2: Implement POST route**

Validate JSON body with `shortsMakerInputSchema`, call `generateShortsPackage`, and return `{ package, warning? }`.

- [ ] **Step 3: Return Korean errors**

Invalid input returns status 400 with `{ error: "입력값을 확인해주세요." }`. Generation failure returns 500 with `{ error: "숏폼 문안을 생성하지 못했습니다." }`.

## Task 4: UI Page

**Files:**
- Create: `src/app/shorts-maker/page.tsx`

- [ ] **Step 1: Build form controls**

Add Korean select controls for product status, target audience, purpose, length, tone, and a memo textarea.

- [ ] **Step 2: Call API and render result**

On submit, POST to `/api/shorts/generate`, show loading state, render all package sections, and preserve form values on errors.

- [ ] **Step 3: Add copy buttons**

Provide buttons that copy the script, subtitles, caption, hashtags, and full package text to the clipboard.

## Task 5: Verification

**Files:**
- No new files unless fixes are needed.

- [ ] **Step 1: Run focused tests**

Run: `npm.cmd test -- src/lib/shorts/shorts-generator.test.ts`

- [ ] **Step 2: Run lint**

Run: `npm.cmd run lint`

- [ ] **Step 3: Inspect diff**

Run: `git diff -- src/lib/shorts src/app/api/shorts src/app/shorts-maker docs/superpowers`

- [ ] **Step 4: Start dev server if needed**

Run: `npm.cmd run dev` and verify `/shorts-maker` loads if the environment allows it.
