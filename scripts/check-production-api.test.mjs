import { describe, expect, it } from "vitest";
import { validateProductionApiConfig } from "./check-production-api.mjs";

describe("production API readiness check", () => {
  it("requires real Supabase and OpenAI for story generation", () => {
    const result = validateProductionApiConfig({
      MOCK_EXTERNAL_SERVICES: "true",
      MOCK_SUPABASE: "true",
      MOCK_OPENAI: "true"
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("MOCK_SUPABASE must be false for production API mode.");
    expect(result.errors).toContain("MOCK_OPENAI must be false for production API mode.");
  });

  it("accepts story API config while keeping payments mocked", () => {
    const result = validateProductionApiConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      OPENAI_API_KEY: "sk-test",
      MOCK_EXTERNAL_SERVICES: "false",
      MOCK_SUPABASE: "false",
      MOCK_OPENAI: "false",
      MOCK_PAYPAL: "true",
      MOCK_TOSS: "true"
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("requires real PayPal keys when payment checks are requested", () => {
    const result = validateProductionApiConfig(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        OPENAI_API_KEY: "sk-test",
        MOCK_EXTERNAL_SERVICES: "false",
        MOCK_SUPABASE: "false",
        MOCK_OPENAI: "false",
        MOCK_PAYPAL: "true"
      },
      { requirePayments: true }
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("MOCK_PAYPAL must be false when checking payments.");
  });

  it("validates PayPal amount and environment when payment checks are requested", () => {
    const result = validateProductionApiConfig(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        OPENAI_API_KEY: "sk-test",
        NEXT_PUBLIC_PAYPAL_CLIENT_ID: "paypal-client",
        PAYPAL_CLIENT_SECRET: "paypal-secret",
        PAYPAL_ENV: "production",
        PAYPAL_CURRENCY: "US",
        PAYPAL_AMOUNT: "free",
        MOCK_EXTERNAL_SERVICES: "false",
        MOCK_SUPABASE: "false",
        MOCK_OPENAI: "false",
        MOCK_PAYPAL: "false"
      },
      { requirePayments: true }
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("PAYPAL_ENV must be sandbox or live.");
    expect(result.errors).toContain(
      "PAYPAL_CURRENCY must be a 3-letter currency code such as USD."
    );
    expect(result.errors).toContain("PAYPAL_AMOUNT must be a positive number.");
  });
});
