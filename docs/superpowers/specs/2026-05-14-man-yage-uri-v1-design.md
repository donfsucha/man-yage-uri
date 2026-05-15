# Man Yage Uri V1 Design

## Goal

Build the V1 MVP for "만약에 우리", a mobile-first AI web novel app where a user creates a free first episode from a breakup scenario, selects the next direction, pays for a five-episode complete story, and reads the generated result in a web viewer.

## Product Scope

V1 focuses on one complete commercial loop:

1. A visitor reads the landing page and starts a free first episode.
2. The user completes a guided input form.
3. The app shows AI-fiction and privacy notices before generation.
4. The server checks the input for safety and personal data risk.
5. The AI returns structured JSON containing title, summary, episode 1, and three next choices.
6. The user reads episode 1 and selects one next choice.
7. The user buys one product: a five-episode complete story.
8. The server confirms payment and generates episodes 2 through 5.
9. The user reads the complete story in the viewer and can see it in their library.
10. The user can request deletion of their story data.

## Explicitly Out Of Scope For V1

- PDF keepsake
- cover image generation
- emotional letter add-on
- three-episode and ten-episode products
- NFC integration
- photo upload
- ex-partner chatbot
- prediction of the other person's feelings
- public community
- broad SNS sharing

## Architecture

The app will use a single Next.js App Router project. Server routes own validation, moderation, OpenAI calls, payment verification, and persistence. Supabase provides PostgreSQL, authentication, and later storage. During the first implementation milestone, external services are represented by narrow adapters so the UI and data model can be built and tested before real credentials are connected.

## Pages

- `/`: mobile-first landing page with a direct start action.
- `/create`: guided story input form.
- `/stories/[id]/preview`: free episode, summary, and next-choice selection.
- `/checkout/[storyId]`: five-episode product checkout handoff.
- `/stories/[id]`: episode viewer for generated stories.
- `/library`: user's generated stories.
- `/delete-data`: user data deletion request.
- `/admin`: basic operational overview for stories, payments, and moderation flags.

## Data Model

Core tables:

- `users`: Supabase-managed user profile extension.
- `story_inputs`: raw and sanitized story setup data.
- `stories`: story-level status, title, genre, summary, and payment state.
- `story_chapters`: generated episode bodies.
- `story_choices`: next-direction choices and selected choice.
- `payments`: Toss payment verification records.
- `moderation_logs`: safety and privacy filter results.
- `prompt_versions`: versioned prompts for generation quality control.
- `admin_users`: minimal admin authorization.

## Story Statuses

- `draft`: input exists but generation has not completed.
- `preview_ready`: free first episode and choices are ready.
- `choice_selected`: user selected the paid-story direction.
- `payment_pending`: payment request was created.
- `paid`: payment was confirmed.
- `completed`: paid episodes were generated.
- `blocked`: moderation blocked generation.
- `generation_failed`: AI generation failed after validation.

## API Surface

- `POST /api/story/input`: validate and save user input.
- `POST /api/moderation/check`: return moderation result for text.
- `POST /api/story/generate-preview`: create title, summary, episode 1, and next choices.
- `POST /api/story/select-choice`: persist the selected next choice.
- `POST /api/payment/request`: create a payment request record.
- `POST /api/payment/confirm`: verify Toss payment data and mark the story as paid.
- `POST /api/story/generate-paid`: generate episodes 2 through 5 after payment.
- `GET /api/story/[id]`: load story, chapters, and choices.
- `DELETE /api/user/delete-data`: request or perform story data deletion.
- `GET /api/admin/stories`: list operational story state.

## AI JSON Contract

Preview generation returns:

```json
{
  "title": "우리가 헤어지지 않았던 밤",
  "genre": "평행세계 로맨스",
  "emotional_tone": "감성적이고 담담함",
  "summary": "마지막 통화에서 주인공이 침묵하지 않고 진심을 말하면서 이야기가 달라진다.",
  "chapters": [
    {
      "chapter_no": 1,
      "chapter_title": "끊기지 않은 전화",
      "body": "전화가 끊기기 직전, 나는 처음으로 침묵을 깨고 말했다...",
      "ending_hook": "그의 숨소리가 멈췄고, 나는 그가 울고 있다는 걸 알았다."
    }
  ],
  "next_choices": [
    { "choice_id": "A", "label": "다시 만날 약속을 잡는다" },
    { "choice_id": "B", "label": "서로의 오해를 천천히 풀어간다" },
    { "choice_id": "C", "label": "마지막 하루를 함께 보낸다" }
  ],
  "safety_flags": {
    "contains_self_harm_risk": false,
    "contains_stalking_risk": false,
    "requires_manual_review": false
  }
}
```

Paid generation returns the same story metadata plus chapters 2 through 5.

## Safety Rules

The product must consistently frame output as fiction for emotional reflection. It must not predict the real other person's mind, encourage contact, generate manipulation messages, or support stalking, self-harm, threats, revenge, doxxing, or illegal behavior.

For V1, moderation uses a deterministic local rule layer plus an AI moderation adapter. The local rule layer blocks obvious phone numbers, addresses, stalking phrases, threats, and self-harm phrases before any generation request.

## Payment

V1 has one product:

- `five_episode_complete`: five-episode complete story, target price 7900 KRW or 9900 KRW.

The server must verify `paymentKey`, `orderId`, and `amount` before marking any story paid. Paid chapter generation must only run after successful server-side verification.

## Admin

The V1 admin area is operational, not editorially complex. It shows stories, payment status, generation status, and moderation flags. Manual editing can be added after the core loop works.

## Testing

The first development pass should test:

- form validation
- moderation blocking
- AI JSON schema validation
- story status transitions
- payment amount verification
- paid-generation authorization

## Milestone Breakdown

1. Project scaffold and local mock story flow.
2. Supabase schema and data access layer.
3. Real OpenAI adapter and prompt versioning.
4. Payment request and Toss confirmation.
5. Paid generation and reader/library.
6. Admin and deletion requests.
7. mobile QA, policy copy, and deployment preparation.

## Self Review

- Scope is limited to the V1 commercial loop.
- PDF, cover, NFC, chatbot, and community are explicitly excluded.
- The payment surface uses one product to reduce branching risk.
- AI output is structured and validated before persistence.
- Safety posture is product-level and API-level, not just copywriting.
