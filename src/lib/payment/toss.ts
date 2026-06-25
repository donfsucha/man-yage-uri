import { getRuntimeConfig } from "@/lib/config/runtime";

export const TOSS_PRODUCT_NAME = "만약에 우리 - 5화 완결본";
export const TOSS_PRODUCT_NAME_EN = "What If Us - Complete Story";

type TossPaymentResponse = {
  paymentKey?: string;
  orderId?: string;
  orderName?: string;
  status?: string;
  method?: string | null;
  currency?: string;
  totalAmount?: number;
};

export type TossPaymentResult = {
  paymentKey: string;
  orderId: string;
  status: string;
  method: string | null;
  currency: string;
  totalAmount: number;
};

export function normalizeTossAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Toss amount must be a positive integer.");
  }

  return amount;
}

export function createTossOrderId(storyId: string) {
  const storyPart = storyId.replace(/-/g, "").slice(0, 32);
  return `toss_${storyPart}_${Date.now()}`;
}

export function getTossAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

export function isExpectedTossPayment(
  payment: TossPaymentResult,
  expected: { orderId: string; amount: number; currency: string }
) {
  return (
    payment.status === "DONE" &&
    payment.orderId === expected.orderId &&
    payment.totalAmount === normalizeTossAmount(expected.amount) &&
    payment.currency === expected.currency.toUpperCase()
  );
}

export async function confirmTossPayment({
  paymentKey,
  orderId,
  amount
}: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const config = getRuntimeConfig();
  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: getTossAuthHeader(config.tossSecretKey),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount: normalizeTossAmount(amount)
    })
  });

  if (!response.ok) {
    throw new Error("Toss payment confirmation failed.");
  }

  const data = (await response.json()) as TossPaymentResponse;

  if (!data.paymentKey || !data.orderId || !data.status || !data.currency) {
    throw new Error("Toss payment response is missing required fields.");
  }

  return {
    paymentKey: data.paymentKey,
    orderId: data.orderId,
    status: data.status,
    method: data.method ?? null,
    currency: data.currency,
    totalAmount: data.totalAmount ?? 0
  } satisfies TossPaymentResult;
}
