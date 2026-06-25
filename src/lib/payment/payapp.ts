import { timingSafeEqual } from "crypto";

export const PAYAPP_API_URL = "https://api.payapp.kr/oapi/apiLoad.html";
export const PAYAPP_PRODUCT_NAME = "만약에 우리 완결편";
export const PAYAPP_PRODUCT_MEMO =
  "선택한 전개에 따른 2화~5화 완결 스토리와 디지털 보너스";
export const DEFAULT_PAYAPP_OPEN_PAY_TYPES =
  "card,kakaopay,naverpay,smilepay,applepay,payco,rbank,tosspay";

type PayAppPaymentRequestInput = {
  appUrl: string;
  amount: number;
  orderId: string;
  openPayTypes?: string;
  recvPhone: string;
  storyId: string;
  title?: string;
  userId: string;
};

export type PayAppResponse = {
  state: string;
  errorMessage: string;
  mulNo: string | null;
  payUrl: string | null;
};

export type PayAppFeedbackPayload = Record<string, string | undefined>;

export function normalizePayAppAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("PayApp amount must be a positive integer.");
  }

  return amount;
}

export function createPayAppOrderId(storyId: string, timestamp = Date.now()) {
  const compactStoryId = storyId.replace(/-/g, "");
  return `payapp_${compactStoryId}_${timestamp}`.slice(0, 64);
}

function normalizeAppUrl(appUrl: string) {
  return appUrl.replace(/\/$/, "");
}

export function toPayAppRequestParams({
  appUrl,
  amount,
  orderId,
  openPayTypes = DEFAULT_PAYAPP_OPEN_PAY_TYPES,
  recvPhone,
  storyId,
  userId
}: PayAppPaymentRequestInput) {
  const origin = normalizeAppUrl(appUrl);

  return new URLSearchParams({
    cmd: "payrequest",
    userid: userId,
    goodname: PAYAPP_PRODUCT_NAME,
    price: String(normalizePayAppAmount(amount)),
    recvphone: recvPhone,
    memo: PAYAPP_PRODUCT_MEMO,
    reqaddr: "0",
    feedbackurl: `${origin}/api/payment/payapp/feedback`,
    returnurl: `${origin}/checkout/${storyId}/payapp/success`,
    var1: storyId,
    var2: orderId,
    smsuse: "n",
    charset: "utf-8",
    openpaytype: openPayTypes,
    checkretry: "y",
    redirectpay: "1"
  });
}

export function parsePayAppResponse(body: string): PayAppResponse {
  const params = new URLSearchParams(body);

  return {
    state: params.get("state") ?? "0",
    errorMessage: params.get("errorMessage") ?? "",
    mulNo: params.get("mul_no"),
    payUrl: params.get("payurl")
  };
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isCompletedPayAppFeedback(payload: PayAppFeedbackPayload) {
  return payload.pay_state === "4";
}

export function isExpectedPayAppFeedback(
  payload: PayAppFeedbackPayload,
  expected: {
    amount: number;
    linkKey: string;
    linkValue: string;
    orderId?: string;
    storyId: string;
    userId: string;
  }
) {
  const expectedAmount = String(normalizePayAppAmount(expected.amount));

  return (
    payload.userid === expected.userId &&
    payload.linkkey === expected.linkKey &&
    typeof payload.linkval === "string" &&
    safeCompare(payload.linkval, expected.linkValue) &&
    payload.price === expectedAmount &&
    payload.var1 === expected.storyId &&
    (!expected.orderId || payload.var2 === expected.orderId)
  );
}

export async function createPayAppPayment(input: PayAppPaymentRequestInput) {
  const response = await fetch(PAYAPP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: toPayAppRequestParams(input)
  });

  if (!response.ok) {
    throw new Error("PayApp payment request failed.");
  }

  const result = parsePayAppResponse(await response.text());

  if (result.state !== "1" || !result.payUrl) {
    throw new Error(result.errorMessage || "PayApp payment URL is missing.");
  }

  return result;
}
