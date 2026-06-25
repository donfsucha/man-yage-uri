import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config/runtime";
import {
  createPayAppOrderId,
  createPayAppPayment,
  normalizePayAppAmount
} from "@/lib/payment/payapp";
import {
  getStory,
  prepareExternalPayment,
  recordAnalyticsEventSafely
} from "@/lib/story/persistence";

const CreatePayAppOrderRequestSchema = z.object({
  storyId: z.string().uuid()
});

function getRequestOrigin(request: Request) {
  const configuredUrl = getRuntimeConfig().appUrl;
  const requestOrigin = new URL(request.url).origin;

  if (configuredUrl && configuredUrl !== "http://localhost:3000") {
    return configuredUrl.replace(/\/$/, "");
  }

  return requestOrigin;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = CreatePayAppOrderRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
  }

  const story = await getStory(parsed.data.storyId);

  if (!story || !story.selectedChoiceId) {
    return NextResponse.json(
      { error: "Select a story direction before payment." },
      { status: 404 }
    );
  }

  const config = getRuntimeConfig();

  if (config.mockPayApp || !config.payAppApiEnabled) {
    return NextResponse.json(
      { error: "PayApp API is not configured yet." },
      { status: 503 }
    );
  }

  try {
    const amount = normalizePayAppAmount(config.payAppAmount);
    const orderId = createPayAppOrderId(story.id);
    const payment = await prepareExternalPayment(story.id, orderId, amount);

    if (!payment) {
      await recordAnalyticsEventSafely({
        eventName: "payment_failed",
        storyId: story.id,
        metadata: { provider: "payapp", reason: "prepare_failed" }
      });

      return NextResponse.json(
        { error: "Payment could not be prepared." },
        { status: 404 }
      );
    }

    const payAppPayment = await createPayAppPayment({
      appUrl: getRequestOrigin(request),
      amount,
      orderId,
      openPayTypes: config.payAppOpenPayTypes,
      recvPhone: config.payAppDefaultRecvPhone,
      storyId: story.id,
      title: story.story.title,
      userId: config.payAppUserId
    });

    await recordAnalyticsEventSafely({
      eventName: "payment_started",
      storyId: story.id,
      metadata: {
        amount,
        currency: "KRW",
        mulNo: payAppPayment.mulNo,
        orderId,
        provider: "payapp"
      }
    });

    return NextResponse.json({
      orderId,
      payUrl: payAppPayment.payUrl,
      state: payAppPayment.state
    });
  } catch (error) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId: story.id,
      metadata: {
        message:
          error instanceof Error ? error.message : "PayApp order creation failed.",
        provider: "payapp"
      }
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "PayApp order creation failed."
      },
      { status: 502 }
    );
  }
}
