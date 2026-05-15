import { describe, expect, it } from "vitest";
import { getRuntimeConfig } from "./runtime";

describe("getRuntimeConfig", () => {
  it("uses real Supabase and OpenAI when keys are present even if Toss is missing", () => {
    const config = getRuntimeConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test",
      OPENAI_API_KEY: "sk-test",
      MOCK_EXTERNAL_SERVICES: "true"
    });

    expect(config.mockSupabase).toBe(false);
    expect(config.mockOpenAI).toBe(false);
    expect(config.mockToss).toBe(true);
  });

  it("allows explicit service mock flags to override key presence", () => {
    const config = getRuntimeConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test",
      MOCK_SUPABASE: "true"
    });

    expect(config.mockSupabase).toBe(true);
  });

  it("enables PayPal when client and secret keys are present", () => {
    const config = getRuntimeConfig({
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: "paypal-client",
      PAYPAL_CLIENT_SECRET: "paypal-secret",
      PAYPAL_ENV: "live",
      PAYPAL_CURRENCY: "USD",
      PAYPAL_AMOUNT: "5.99",
      MOCK_EXTERNAL_SERVICES: "true"
    });

    expect(config.mockPayPal).toBe(false);
    expect(config.paypalClientId).toBe("paypal-client");
    expect(config.paypalEnv).toBe("live");
    expect(config.paypalCurrency).toBe("USD");
    expect(config.paypalAmount).toBe("5.99");
  });
});
