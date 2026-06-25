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
      PAYPAL_AMOUNT: "4.99",
      MOCK_EXTERNAL_SERVICES: "true"
    });

    expect(config.mockPayPal).toBe(false);
    expect(config.paypalClientId).toBe("paypal-client");
    expect(config.paypalEnv).toBe("live");
    expect(config.paypalCurrency).toBe("USD");
    expect(config.paypalAmount).toBe("4.99");
  });

  it("enables Toss when client and secret keys are present", () => {
    const config = getRuntimeConfig({
      NEXT_PUBLIC_TOSS_CLIENT_KEY: "toss-client",
      TOSS_SECRET_KEY: "toss-secret",
      TOSS_AMOUNT: "7900",
      NEXT_PUBLIC_APP_URL: "https://ifwe.cnanfc.com",
      MOCK_EXTERNAL_SERVICES: "true"
    });

    expect(config.mockToss).toBe(false);
    expect(config.tossClientKey).toBe("toss-client");
    expect(config.tossSecretKey).toBe("toss-secret");
    expect(config.tossCurrency).toBe("KRW");
    expect(config.tossAmount).toBe(7900);
    expect(config.appUrl).toBe("https://ifwe.cnanfc.com");
  });

  it("enables PayApp when a checkout link is present", () => {
    const config = getRuntimeConfig({
      NEXT_PUBLIC_PAYAPP_CHECKOUT_URL: "https://payapp.kr/link/test",
      PAYAPP_AMOUNT: "7900",
      MOCK_EXTERNAL_SERVICES: "true"
    });

    expect(config.mockPayApp).toBe(false);
    expect(config.payAppCheckoutUrl).toBe("https://payapp.kr/link/test");
    expect(config.payAppAmount).toBe(7900);
  });

  it("enables PayApp API when seller credentials and receiver phone are present", () => {
    const config = getRuntimeConfig({
      PAYAPP_USER_ID: "seller-id",
      PAYAPP_LINK_KEY: "link-key",
      PAYAPP_LINK_VALUE: "link-value",
      PAYAPP_DEFAULT_RECVPHONE: "01000000000",
      PAYAPP_AMOUNT: "7900",
      MOCK_EXTERNAL_SERVICES: "true"
    });

    expect(config.mockPayApp).toBe(false);
    expect(config.payAppApiEnabled).toBe(true);
    expect(config.payAppUserId).toBe("seller-id");
    expect(config.payAppLinkKey).toBe("link-key");
    expect(config.payAppLinkValue).toBe("link-value");
    expect(config.payAppDefaultRecvPhone).toBe("01000000000");
  });
});
