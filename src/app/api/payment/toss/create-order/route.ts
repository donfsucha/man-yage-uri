import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config/runtime";
import {
  createTossOrderId,
  normalizeTossAmount,
  TOSS_PRODUCT_NAME,
  TOSS_PRODUCT_NAME_EN
} from "@/lib/payment/toss";
import {
  getStory,
  prepareExternalPayment,
  recordAnalyticsEventSafely
} from "@/lib/story/persistence";

const CreateTossOrderRequestSchema = z.object({
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

  const parsed = CreateTossOrderRequestSchema.safeParse(body);

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

  if (config.mockToss || !config.tossClientKey || !config.tossSecretKey) {
    return NextResponse.json(
      { error: "Toss Payments is not configured yet." },
      { status: 503 }
    );
  }

  try {
    const amount = normalizeTossAmount(config.tossAmount);
    const orderId = createTossOrderId(story.id);
    const origin = getRequestOrigin(request);
    const successUrl = `${origin}/checkout/${story.id}/toss/success`;
    const failUrl = `${origin}/checkout/${story.id}/toss/fail`;
    const locale = story.input.outputLanguage === "en" ? "en" : "ko";
    const orderName = locale === "en" ? TOSS_PRODUCT_NAME_EN : TOSS_PRODUCT_NAME;
    const payment = await prepareExternalPayment(story.id, orderId, amount);

    if (!payment) {
      await recordAnalyticsEventSafely({
        eventName: "payment_failed",
        storyId: story.id,
        metadata: { provider: "toss", reason: "prepare_failed" }
      });

      return NextResponse.json(
        { error: "Payment could not be prepared." },
        { status: 404 }
      );
    }

    await recordAnalyticsEventSafely({
      eventName: "payment_started",
      storyId: story.id,
      metadata: {
        amount,
        currency: config.tossCurrency,
        orderId,
        provider: "toss"
      }
    });

    return NextResponse.json({
      orderId,
      orderName,
      amount,
      currency: config.tossCurrency,
      customerKey: `guest_${story.id.replace(/-/g, "").slice(0, 32)}`,
      successUrl,
      failUrl
    });
  } catch (error) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId: story.id,
      metadata: {
        message:
          error instanceof Error ? error.message : "Toss order creation failed.",
        provider: "toss"
      }
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Toss order creation failed."
      },
      { status: 502 }
    );
  }
}
