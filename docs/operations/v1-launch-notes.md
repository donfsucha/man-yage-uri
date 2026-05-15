# V1 Launch Notes

## Current State

The local V1 demo now covers:

1. Landing page
2. Guided story input
3. deterministic safety filter
4. free first-episode generation
5. next-choice selection
6. five-episode checkout preparation
7. mock payment confirmation
8. paid chapters 2 through 5 generation
9. complete story viewer
10. local library
11. local admin summary
12. story data deletion by story ID

The app intentionally uses in-memory storage for the local demo. Restarting the dev server clears created stories.

## Service Mock Flags

Use service-specific flags when only some credentials are ready:

```env
MOCK_SUPABASE=false
MOCK_OPENAI=false
MOCK_TOSS=true
```

This setup stores stories in Supabase and generates text with OpenAI while keeping Toss Payments in mock mode until a normal Toss Payments API key is available.

## Before Production

Replace local demo adapters with real services:

- Apply `supabase/migrations/202605140001_v1_schema.sql` to Supabase.
- Add Supabase data access functions for story inputs, stories, chapters, choices, payments, moderation logs, and deletion requests.
- Replace mock preview and paid chapter generation with the OpenAI story adapter.
- Replace `/api/payment/mock-confirm` with Toss payment request and server-side confirm routes.
- Add authentication for `/library`, `/delete-data`, and `/admin`.
- Restrict `/admin` through `admin_users`.
- Store prompt versions in `prompt_versions`.
- Add refund and failed-generation recovery handling.

## Required Environment Variables

See `.env.example`.

Never commit real keys. Keep `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `TOSS_SECRET_KEY` server-only.

## Safety Positioning

Every generated story must keep the same product promise:

- It is fiction.
- It does not predict a real person's feelings or future.
- It does not encourage contacting, tracking, pressuring, or manipulating an ex-partner.
- It blocks or redirects self-harm, stalking, threats, revenge, and personal data.

## Recommended Next Production Milestone

Implement Supabase persistence first. Payment and OpenAI generation both depend on durable story and payment state, so database persistence should come before real Toss or OpenAI credentials are wired in.
