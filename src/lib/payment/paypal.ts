import { getRuntimeConfig } from "@/lib/config/runtime";

type PayPalEnv = "sandbox" | "live";

type PayPalOrderPayloadInput = {
  storyId: string;
  title: string;
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
};

export function getPayPalBaseUrl(env: PayPalEnv) {
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function toPayPalOrderPayload({
  storyId,
  title,
  amount,
  currency
}: PayPalOrderPayloadInput) {
  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        custom_id: storyId,
        description: `${title} - five episode pack`,
        amount: {
          currency_code: currency,
          value: amount
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

  return {
    orderId: data.id ?? orderId,
    status: data.status ?? "UNKNOWN"
  };
}
