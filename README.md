# 만약의 우리

이별 순간을 안전한 개인화 5화 픽션 스토리로 바꾸는 AI 웹소설 MVP입니다.

## Local development

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill the required keys.

For a local demo without real external services:

```env
MOCK_EXTERNAL_SERVICES=true
MOCK_SUPABASE=true
MOCK_OPENAI=true
MOCK_TOSS=true
MOCK_PAYPAL=true
```

For a public demo with real storage and AI:

```env
MOCK_EXTERNAL_SERVICES=false
MOCK_SUPABASE=false
MOCK_OPENAI=false
MOCK_TOSS=true
MOCK_PAYPAL=true
```

## Conversion validation

The current MVP is set up to test whether readers want to continue after the
free first chapter.

Tracked events:

```text
landing_view
story_start
preview_generated
checkout_click
```

The admin page at `/admin` shows story counts, completion counts, pending
payments, and checkout click counts.

## Scripts

```powershell
npm.cmd test
npm.cmd run build
npm.cmd start
```

## Deployment

See [docs/operations/deploy-vercel.md](docs/operations/deploy-vercel.md).
