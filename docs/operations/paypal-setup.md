# PayPal setup guide

Use PayPal first while Toss Payments is under review. Start with Sandbox keys, then
switch to Live after a successful end-to-end test.

## 1. Create a PayPal developer app

1. Open https://developer.paypal.com/dashboard/applications/sandbox.
2. Sign in with a PayPal Business account.
3. Choose **Create App**.
4. Select **Merchant** as the app type.
5. Copy the Sandbox **Client ID** and **Secret**.

PayPal uses the Client ID in the browser SDK and the Secret only on the server.
Never paste the Secret into client code, screenshots, or GitHub.

## 2. Add local environment variables

Put these values in `.env.local`.

```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_ENV=sandbox
PAYPAL_CURRENCY=USD
PAYPAL_AMOUNT=4.99
MOCK_PAYPAL=false
```

Keep these values enabled while testing the real story and database APIs:

```env
MOCK_SUPABASE=false
MOCK_OPENAI=false
MOCK_TOSS=true
```

## 3. Restart and verify

Restart the Next.js server after changing `.env.local`.

```powershell
npm.cmd run check:prod-api -- --with-payments
npm.cmd run dev
```

Then test the flow:

1. Open `/create`.
2. Generate a preview.
3. Choose one branch.
4. Open checkout.
5. Pay with a PayPal Sandbox personal buyer account.
6. Confirm that the reader opens the completed story.

## 4. Sandbox buyer account

Create or use a Sandbox personal account at
https://developer.paypal.com/dashboard/accounts. This is separate from the
merchant app. Use the Sandbox buyer email and password inside the PayPal popup.

## 5. Production switch

After the sandbox flow works:

1. Create or open a Live PayPal app.
2. Replace the Client ID and Secret with Live credentials.
3. Set `PAYPAL_ENV=live`.
4. Keep `MOCK_PAYPAL=false`.
5. Re-run `npm.cmd run check:prod-api -- --with-payments`.

The current server capture path validates PayPal's returned story ID, amount,
and currency before unlocking paid chapters.
