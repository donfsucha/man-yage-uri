type RuntimeEnv = Record<string, string | undefined>;

function boolFromEnv(value: string | undefined) {
  if (value === undefined || value === "") {
    return null;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function serviceMockValue(
  env: RuntimeEnv,
  serviceKey:
    | "MOCK_SUPABASE"
    | "MOCK_OPENAI"
    | "MOCK_TOSS"
    | "MOCK_PAYPAL"
    | "MOCK_PAYAPP",
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

function payAppMockValue(env: RuntimeEnv) {
  const explicit = boolFromEnv(env.MOCK_PAYAPP);

  if (explicit !== null) {
    return explicit;
  }

  const hasCheckoutLink = Boolean(env.NEXT_PUBLIC_PAYAPP_CHECKOUT_URL);
  const hasApiKeys = [
    "PAYAPP_USER_ID",
    "PAYAPP_LINK_KEY",
    "PAYAPP_LINK_VALUE",
    "PAYAPP_DEFAULT_RECVPHONE"
  ].every((key) => Boolean(env[key]));

  if (hasCheckoutLink || hasApiKeys) {
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
  const mockPayApp = payAppMockValue(env);
  const paypalEnv: "sandbox" | "live" =
    env.PAYPAL_ENV === "live" ? "live" : "sandbox";
  const payAppApiEnabled = Boolean(
    env.PAYAPP_USER_ID &&
      env.PAYAPP_LINK_KEY &&
      env.PAYAPP_LINK_VALUE &&
      env.PAYAPP_DEFAULT_RECVPHONE
  );

  return {
    mockSupabase,
    mockOpenAI,
    mockToss,
    mockPayPal,
    mockPayApp,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    openAiApiKey: env.OPENAI_API_KEY ?? "",
    openAiStoryModel: env.OPENAI_STORY_MODEL || "gpt-4.1-mini",
    paypalClientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
    paypalClientSecret: env.PAYPAL_CLIENT_SECRET ?? "",
    paypalEnv,
    paypalCurrency: env.PAYPAL_CURRENCY || "USD",
    paypalAmount: env.PAYPAL_AMOUNT || "4.99",
    tossClientKey: env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "",
    tossSecretKey: env.TOSS_SECRET_KEY ?? "",
    tossCurrency: "KRW",
    tossAmount: Number(env.TOSS_AMOUNT ?? "7900"),
    payAppApiEnabled,
    payAppUserId: env.PAYAPP_USER_ID ?? "",
    payAppLinkKey: env.PAYAPP_LINK_KEY ?? "",
    payAppLinkValue: env.PAYAPP_LINK_VALUE ?? "",
    payAppDefaultRecvPhone: env.PAYAPP_DEFAULT_RECVPHONE ?? "",
    payAppOpenPayTypes:
      env.PAYAPP_OPEN_PAY_TYPES ??
      "card,kakaopay,naverpay,smilepay,applepay,payco,rbank,tosspay",
    payAppCheckoutUrl: env.NEXT_PUBLIC_PAYAPP_CHECKOUT_URL ?? "",
    payAppAmount: Number(env.PAYAPP_AMOUNT ?? env.TOSS_AMOUNT ?? "7900"),
    appUrl:
      env.NEXT_PUBLIC_APP_URL ??
      (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000")
  };
}
