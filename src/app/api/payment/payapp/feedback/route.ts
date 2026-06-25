import { getRuntimeConfig } from "@/lib/config/runtime";
import {
  isCompletedPayAppFeedback,
  isExpectedPayAppFeedback,
  normalizePayAppAmount,
  type PayAppFeedbackPayload
} from "@/lib/payment/payapp";
import {
  completePreparedPaidStory,
  recordAnalyticsEventSafely
} from "@/lib/story/persistence";

function textResponse(body: "SUCCESS" | "FAIL", status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

async function readPayAppFeedback(request: Request) {
  const formData = await request.formData();
  const payload: PayAppFeedbackPayload = {};

  for (const [key, value] of formData.entries()) {
    payload[key] = typeof value === "string" ? value : value.name;
  }

  return payload;
}

export async function POST(request: Request) {
  let payload: PayAppFeedbackPayload;

  try {
    payload = await readPayAppFeedback(request);
  } catch {
    return textResponse("FAIL", 400);
  }

  const config = getRuntimeConfig();
  const storyId = payload.var1 ?? "";
  const orderId = payload.var2 ?? undefined;

  if (config.mockPayApp || !config.payAppApiEnabled) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId: storyId || null,
      metadata: { provider: "payapp", reason: "api_not_configured" }
    });

    return textResponse("FAIL", 503);
  }

  const expected = {
    amount: normalizePayAppAmount(config.payAppAmount),
    linkKey: config.payAppLinkKey,
    linkValue: config.payAppLinkValue,
    orderId,
    storyId,
    userId: config.payAppUserId
  };

  if (!storyId || !isExpectedPayAppFeedback(payload, expected)) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId: storyId || null,
      metadata: {
        provider: "payapp",
        reason: "feedback_mismatch",
        payState: payload.pay_state,
        mulNo: payload.mul_no
      }
    });

    return textResponse("FAIL", 400);
  }

  if (!isCompletedPayAppFeedback(payload)) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId,
      metadata: {
        provider: "payapp",
        reason: "not_completed",
        payState: payload.pay_state,
        orderId,
        mulNo: payload.mul_no
      }
    });

    return textResponse("SUCCESS");
  }

  try {
    const completed = await completePreparedPaidStory(storyId, orderId);

    if (!completed) {
      await recordAnalyticsEventSafely({
        eventName: "payment_failed",
        storyId,
        metadata: {
          provider: "payapp",
          reason: "paid_story_generation_failed",
          orderId,
          mulNo: payload.mul_no
        }
      });

      return textResponse("FAIL", 500);
    }

    await recordAnalyticsEventSafely({
      eventName: "payment_success",
      storyId,
      metadata: {
        amount: config.payAppAmount,
        currency: "KRW",
        orderId,
        provider: "payapp",
        mulNo: payload.mul_no,
        payType: payload.pay_type
      }
    });

    return textResponse("SUCCESS");
  } catch (error) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId,
      metadata: {
        message:
          error instanceof Error ? error.message : "PayApp feedback failed.",
        orderId,
        provider: "payapp"
      }
    });

    return textResponse("FAIL", 500);
  }
}
