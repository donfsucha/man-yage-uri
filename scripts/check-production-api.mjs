import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

function boolFromEnv(value) {
  if (value === undefined || value === "") {
    return null;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function serviceMockValue(env, serviceKey, requiredKeys) {
  const explicit = boolFromEnv(env[serviceKey]);

  if (explicit !== null) {
    return explicit;
  }

  if (requiredKeys.every((key) => Boolean(env[key]))) {
    return false;
  }

  return boolFromEnv(env.MOCK_EXTERNAL_SERVICES) ?? true;
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const env = {};

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }

  return env;
}

export function validateProductionApiConfig(env, options = {}) {
  const errors = [];
  const requirePayments = Boolean(options.requirePayments);
  const mockSupabase = serviceMockValue(env, "MOCK_SUPABASE", [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
  ]);
  const mockOpenAI = serviceMockValue(env, "MOCK_OPENAI", ["OPENAI_API_KEY"]);
  const mockPayPal = serviceMockValue(env, "MOCK_PAYPAL", [
    "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET"
  ]);

  if (mockSupabase) {
    errors.push("MOCK_SUPABASE must be false for production API mode.");
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY is required.");
  }

  if (mockOpenAI) {
    errors.push("MOCK_OPENAI must be false for production API mode.");
  }

  if (!env.OPENAI_API_KEY) {
    errors.push("OPENAI_API_KEY is required.");
  }

  if (requirePayments) {
    if (mockPayPal) {
      errors.push("MOCK_PAYPAL must be false when checking payments.");
    }

    if (!env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
      errors.push("NEXT_PUBLIC_PAYPAL_CLIENT_ID is required when checking payments.");
    }

    if (!env.PAYPAL_CLIENT_SECRET) {
      errors.push("PAYPAL_CLIENT_SECRET is required when checking payments.");
    }

    if (!["sandbox", "live"].includes(env.PAYPAL_ENV || "sandbox")) {
      errors.push("PAYPAL_ENV must be sandbox or live.");
    }

    if (!/^[A-Z]{3}$/.test(env.PAYPAL_CURRENCY || "USD")) {
      errors.push("PAYPAL_CURRENCY must be a 3-letter currency code such as USD.");
    }

    if (!env.PAYPAL_AMOUNT || !Number.isFinite(Number(env.PAYPAL_AMOUNT)) || Number(env.PAYPAL_AMOUNT) <= 0) {
      errors.push("PAYPAL_AMOUNT must be a positive number.");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    mockSupabase,
    mockOpenAI,
    mockPayPal
  };
}

async function checkSupabaseSchema(env) {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
  const checks = [
    [
      "story_scenes table",
      supabase
        .from("story_scenes")
        .select("scene_no,title,setting,body,dialogue,visual_prompt,emotion")
        .limit(1)
    ],
    [
      "story_choices.chapter_no column",
      supabase.from("story_choices").select("chapter_no").limit(1)
    ]
  ];
  const errors = [];

  for (const [label, query] of checks) {
    const result = await query;

    if (result.error) {
      errors.push(`${label}: ${result.error.message}`);
    }
  }

  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const envArg = args.find((arg) => arg.startsWith("--env="));
  const envFile = envArg ? envArg.slice("--env=".length) : ".env.local";
  const requirePayments = args.includes("--with-payments");
  const skipLive = args.includes("--skip-live");
  const env = { ...process.env, ...loadEnvFile(envFile) };
  const result = validateProductionApiConfig(env, { requirePayments });
  const errors = [...result.errors];

  if (!skipLive && !result.mockSupabase && env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push(...(await checkSupabaseSchema(env)));
  }

  if (errors.length > 0) {
    console.error("Production API check failed:");

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exit(1);
  }

  console.log("Production API check passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
