import { getRuntimeConfig } from "@/lib/config/runtime";

type PayPalEnv = "sandbox" | "live";

type PayPalOrderPayloadInput = {
  storyId: string;
  title?: string;
  amount: string;
  currency: string;
};

type PayPalOrderResponse = {
  id?: string;
  status?: string;
};

type PayPalCaptureResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
};

export type PayPalCaptureResult = {
  orderId: string;
  status: string;
  storyId: string | null;
  captureId: string | null;
  amount: string | null;
  currency: string | null;
};

export const PAYPAL_PRODUCT_NAME = "What If Us - Complete Story";
export const PAYPAL_PRODUCT_DESCRIPTION =
  "A five-chapter AI-generated fictional story based on your selected emotional turning point.";

export function getPayPalBaseUrl(env: PayPalEnv) {
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function normalizePayPalAmount(amount: string, currency: string) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("PayPal amount must be a positive number.");
  }

  return currency.toUpperCase() === "JPY"
    ? String(Math.round(numericAmount))
    : numericAmount.toFixed(2);
}

export function toPaymentMinorUnits(amount: string, currency: string) {
  const normalizedAmount = normalizePayPalAmount(amount, currency);
  const multiplier = currency.toUpperCase() === "JPY" ? 1 : 100;

  return Math.round(Number(normalizedAmount) * multiplier);
}

export function isExpectedPayPalCapture(
  capture: PayPalCaptureResult,
  expected: { storyId: string; amount: string; currency: string }
) {
  return (
    capture.status === "COMPLETED" &&
    capture.storyId === expected.storyId &&
    capture.currency === expected.currency.toUpperCase() &&
    capture.amount === normalizePayPalAmount(expected.amount, expected.currency)
  );
}

export function toPayPalOrderPayload({
  storyId,
  amount,
  currency
}: PayPalOrderPayloadInput) {
  const normalizedCurrency = currency.toUpperCase();

  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        custom_id: storyId,
        description: PAYPAL_PRODUCT_NAME,
        items: [
          {
            name: PAYPAL_PRODUCT_NAME,
            description: PAYPAL_PRODUCT_DESCRIPTION,
            quantity: "1",
            unit_amount: {
              currency_code: normalizedCurrency,
              value: normalizePayPalAmount(amount, normalizedCurrency)
            }
          }
        ],
        amount: {
          currency_code: normalizedCurrency,
          value: normalizePayPalAmount(amount, normalizedCurrency),
          breakdown: {
            item_total: {
              currency_code: normalizedCurrency,
              value: normalizePayPalAmount(amount, normalizedCurrency)
            }
          }
        }
      }
    ]
  };
}

async function getAccessToken() {
  const config = getRuntimeConfig();
  const credentials = Buffer.from(
    `${config.paypalClientId}:${config.paypalClientSecret}`
  ).toString("base64");
  const response = await fetch(`${getPayPalBaseUrl(config.paypalEnv)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    throw new Error("PayPal access token request failed.");
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data.access_token) {
    throw new Error("PayPal access token is missing.");
  }

  return data.access_token;
}

export async function createPayPalOrder(input: PayPalOrderPayloadInput) {
  const config = getRuntimeConfig();
  const accessToken = await getAccessToken();
  const response = await fetch(
    `${getPayPalBaseUrl(config.paypalEnv)}/v2/checkout/orders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(toPayPalOrderPayload(input))
    }
  );

  if (!response.ok) {
    throw new Error("PayPal order creation failed.");
  }

  const data = (await response.json()) as PayPalOrderResponse;

  if (!data.id) {
    throw new Error("PayPal order ID is missing.");
  }

  return {
    orderId: data.id,
    status: data.status ?? "CREATED"
  };
}

export async function capturePayPalOrder(orderId: string) {
  const config = getRuntimeConfig();
  const accessToken = await getAccessToken();
  const response = await fetch(
    `${getPayPalBaseUrl(config.paypalEnv)}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error("PayPal order capture failed.");
  }

  const data = (await response.json()) as PayPalCaptureResponse;
  const purchaseUnit = data.purchase_units?.[0];
  const completedCapture =
    purchaseUnit?.payments?.captures?.find(
      (capture) => capture.status === "COMPLETED"
    ) ?? purchaseUnit?.payments?.captures?.[0];

  return {
    orderId: data.id ?? orderId,
    status: data.status ?? completedCapture?.status ?? "UNKNOWN",
    storyId: purchaseUnit?.custom_id ?? null,
    captureId: completedCapture?.id ?? null,
    amount: completedCapture?.amount?.value ?? null,
    currency: completedCapture?.amount?.currency_code ?? null
  };
}
