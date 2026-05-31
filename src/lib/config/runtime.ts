type RuntimeEnv = Record<string, string | undefined>;

function boolFromEnv(value: string | undefined) {
  if (value === undefined || value === "") {
    return null;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function serviceMockValue(
  env: RuntimeEnv,
  serviceKey: "MOCK_SUPABASE" | "MOCK_OPENAI" | "MOCK_TOSS" | "MOCK_PAYPAL",
  requiredKeys: string[]
) {
  const explicit = boolFromEnv(env[serviceKey]);

  if (explicit !== null) {
    return explicit;
  }

  const hasRequiredKeys = requiredKeys.every((key) => Boolean(env[key]));

  if (hasRequiredKeys) {
    return false;
  }

  const globalMock = boolFromEnv(env.MOCK_EXTERNAL_SERVICES);
  return globalMock ?? true;
}

export function getRuntimeConfig(env: RuntimeEnv = process.env) {
  const mockSupabase = serviceMockValue(env, "MOCK_SUPABASE", [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
  ]);
  const mockOpenAI = serviceMockValue(env, "MOCK_OPENAI", ["OPENAI_API_KEY"]);
  const mockToss = serviceMockValue(env, "MOCK_TOSS", [
    "NEXT_PUBLIC_TOSS_CLIENT_KEY",
    "TOSS_SECRET_KEY"
  ]);
  const mockPayPal = serviceMockValue(env, "MOCK_PAYPAL", [
    "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET"
  ]);
  const paypalEnv: "sandbox" | "live" =
    env.PAYPAL_ENV === "live" ? "live" : "sandbox";

  return {
    mockSupabase,
    mockOpenAI,
    mockToss,
    mockPayPal,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    openAiApiKey: env.OPENAI_API_KEY ?? "",
    openAiStoryModel: env.OPENAI_STORY_MODEL || "gpt-4.1-mini",
    paypalClientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
    paypalClientSecret: env.PAYPAL_CLIENT_SECRET ?? "",
    paypalEnv,
    paypalCurrency: env.PAYPAL_CURRENCY || "USD",
    paypalAmount: env.PAYPAL_AMOUNT || "4.99"
  };
}
