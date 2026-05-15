# 만약에 우리

AI fiction web novel MVP for turning a breakup moment into a safe, personalized
five-episode fictional story.

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

## Scripts

```powershell
npm.cmd test
npm.cmd run build
npm.cmd start
```

## Deployment

See [docs/operations/deploy-vercel.md](docs/operations/deploy-vercel.md).
