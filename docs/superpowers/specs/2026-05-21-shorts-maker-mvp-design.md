# Shorts Maker MVP Design

## Goal

Build an internal short-form content completion tool for `성경통독 거치대야` / `XCAN PLAYER`.

The first version helps the user generate ready-to-review Korean short-form packages:

- script
- subtitles
- promotional captions
- titles
- hashtags
- calls to action
- storyboard and shot checklist

This MVP does not create final video files, upload to social platforms, or publish posts automatically.

## Product Context

The product is a Bible-reading routine stand/app experience. The core message is:

> 폰을 거치대에 올리는 순간, 성경통독 루틴이 시작됩니다.

As of 2026-05-21, the Play Store listing is in an identity/status transition. The currently safe public wording is:

- 플레이스토어 정보 업데이트 신청 중
- 공식 출시 준비 단계
- 출시 준비 중

The tool must not generate copy that claims final Play Store approval, `(주)씨엔에이` listing visibility, app availability, downloads, official partnerships, or guaranteed outcomes unless the user explicitly selects a confirmed status in the interface.

## Users

Primary user:

- CNA operator creating promotional shorts for `성경통독 거치대야`

Secondary audiences represented in generated content:

- senior Christians and parents
- ordinary believers who want a Bible-reading habit
- church leaders, media teams, and ministry operators
- gift buyers

## MVP Scope

Add a new internal page at `/shorts-maker`.

The page lets the operator choose:

- product status
- target audience
- content purpose
- video length
- tone
- optional extra memo

The page sends those inputs to an API route and renders a structured content package.

The generated package includes:

- 3 hook options
- one short-form script
- subtitle lines
- scene-by-scene storyboard
- shot list and asset needs
- title options
- YouTube Shorts / Instagram Reels / TikTok caption
- hashtags
- CTA options
- thumbnail text options
- human review checklist

## Non-Goals

The MVP will not:

- render MP4 files
- edit uploaded videos
- generate AI images
- upload to YouTube, Instagram, TikTok, or Play Store
- schedule posts
- store generated packages in Supabase
- add authentication or user roles
- add new production dependencies

## Recommended Architecture

Use the existing Next.js app and add isolated files for the new feature.

Planned files:

- `src/app/shorts-maker/page.tsx`
- `src/app/api/shorts/generate/route.ts`
- `src/lib/shorts/schema.ts`
- `src/lib/shorts/shorts-generator.ts`
- `src/lib/shorts/mock-shorts-generator.ts`
- `src/lib/shorts/shorts-generator.test.ts`

This keeps the feature separate from the existing story-generation code and avoids touching the current dirty worktree unless necessary.

## Data Model

Input shape:

```ts
type ShortsMakerInput = {
  productStatus:
    | "play_store_update_pending"
    | "launch_preparing"
    | "officially_launched";
  audience:
    | "seniors_parents"
    | "church_teams"
    | "ordinary_believers"
    | "gift_buyers";
  purpose:
    | "launch_notice"
    | "product_explainer"
    | "usage_guide"
    | "church_adoption"
    | "parent_empathy";
  length: "15s" | "30s" | "45s";
  tone:
    | "warm"
    | "trustworthy"
    | "simple_friendly"
    | "church_proposal";
  memo?: string;
};
```

Output shape:

```ts
type ShortsPackage = {
  hooks: string[];
  script: string;
  subtitles: string[];
  storyboard: Array<{
    scene: string;
    visual: string;
    narration: string;
    onScreenText: string;
  }>;
  shotList: string[];
  titleOptions: string[];
  caption: string;
  hashtags: string[];
  ctaOptions: string[];
  thumbnailTextOptions: string[];
  reviewChecklist: string[];
};
```

Use Zod schemas so API input and generated output can be validated.

## Generation Behavior

When `MOCK_OPENAI=true` or no API key is available, return a deterministic mock package. This lets the page work during local development and demos.

When OpenAI is enabled, call the existing OpenAI dependency from a server route. The prompt must:

- keep copy in Korean
- use the product positioning above
- tailor content to the selected audience, purpose, length, and tone
- avoid overclaiming Play Store state
- keep church-market wording warm and practical
- include the review checklist every time

For `officially_launched`, the generated copy may say the app is officially launched. For all other statuses, the generated copy must use cautious launch-preparation wording.

## UI Design

The `/shorts-maker` screen is an internal work tool, not a marketing page.

Layout:

- compact header with page title and current product label
- left-side or top form controls, depending on viewport
- generated result area with sections for script, subtitles, caption, hashtags, and checklist
- copy buttons for each output block
- loading and error states

Style:

- use the existing global CSS/Tailwind patterns
- avoid decorative hero sections
- keep controls dense, clear, and readable
- use Korean labels throughout

## Error Handling

The API should return clear JSON errors for:

- invalid input
- generation failure
- invalid generated output

The UI should display a short Korean error message and keep the user's selected inputs.

If the AI output cannot be validated, the route should return a fallback mock-style response with a warning rather than leaving the operator with a blank screen.

## Testing

Add focused tests for:

- input schema accepts valid options
- input schema rejects unknown status/audience/purpose values
- prompt/status rules do not allow `정식 출시 완료` wording unless the status is `officially_launched`
- mock generator returns all required fields

Run the smallest relevant command before completion:

```powershell
npm.cmd test -- src/lib/shorts/shorts-generator.test.ts
```

If the page is implemented in the same pass, also run:

```powershell
npm.cmd run lint
```

## Risks

- Current repository files have many unrelated uncommitted changes. The implementation must avoid rewriting existing pages or shared modules unless required.
- Existing Korean text in some app files appears mojibake-encoded. The new feature should use UTF-8 Korean strings in newly added files and avoid editing corrupted legacy text.
- Public launch wording can become stale after Play Store approval. The operator must update the selected status before generating post-ready copy.

## Future Extensions

After the MVP is useful, later versions can add:

- saved content history
- Supabase persistence
- uploaded product clips and image references
- SRT subtitle export
- automatic storyboard-to-editing checklist
- scheduled weekly generation from inside the app
- social-platform posting integrations after account and rights checks
