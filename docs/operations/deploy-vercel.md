# Vercel deployment guide

This app is a Next.js application. The quickest public deployment path is Vercel
with Supabase as the hosted database.

## 1. Prepare the project

Run these checks before deploying:

```powershell
npm.cmd test
npm.cmd run build
```

The production start command is:

```powershell
npm.cmd start
```

## 2. Create the Vercel project

1. Push this project to a GitHub repository.
2. Open Vercel and choose **Add New Project**.
3. Import the GitHub repository.
4. Keep the default Next.js settings:
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: leave empty

## 3. Add environment variables in Vercel

Add these in **Project Settings > Environment Variables**.

Before setting `MOCK_SUPABASE=false`, apply the Supabase migrations in
`supabase/migrations`, including the `analytics_events` table used for checkout
click validation.

### Required for a real public demo

```env
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
OPENAI_STORY_MODEL=gpt-4.1-mini

MOCK_EXTERNAL_SERVICES=false
MOCK_SUPABASE=false
MOCK_OPENAI=false
```

### Keep payments mocked while testing

Use this when you want the public site to work without taking real payments.

```env
MOCK_TOSS=true
MOCK_PAYPAL=true
```

### Enable Toss Payments later

```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
MOCK_TOSS=false
```

### Enable PayPal later

```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=sandbox
PAYPAL_CURRENCY=USD
PAYPAL_AMOUNT=5.99
MOCK_PAYPAL=false
```

## 4. Deploy

After saving environment variables:

1. Click **Deploy** in Vercel.
2. Open the deployed URL.
3. Create a new story from `/create`.
4. Select a direction in the preview.
5. Complete with mocked payment or a real provider if keys are enabled.

## 5. Production checklist

- Set `NEXT_PUBLIC_APP_URL` to the final deployed domain.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `TOSS_SECRET_KEY`, and
  `PAYPAL_CLIENT_SECRET` as server-side environment variables only.
- Do not expose secret keys in client code or screenshots.
- Use PayPal sandbox before changing `PAYPAL_ENV=live`.
- Decide whether the international PayPal price should stay at `USD 5.99` or
  match the Korean `KRW 7,900` product price through a separate pricing policy.
