import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config/runtime";
import { createPayPalOrder, toPaymentMinorUnits } from "@/lib/payment/paypal";
import {
  getStory,
  prepareExternalPayment,
  recordAnalyticsEventSafely
} from "@/lib/story/persistence";

const CreatePayPalOrderRequestSchema = z.object({
  storyId: z.string().uuid()
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = CreatePayPalOrderRequestSchema.safeParse(body);

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

  if (config.mockPayPal) {
    await recordAnalyticsEventSafely({
      eventName: "payment_started",
      storyId: story.id,
      metadata: { provider: "paypal", mock: true }
    });

    return NextResponse.json({
      orderId: `mock_paypal_${story.id}`,
      status: "CREATED",
      mock: true
    });
  }

  try {
    const order = await createPayPalOrder({
      storyId: story.id,
      title: story.story.title,
      amount: config.paypalAmount,
      currency: config.paypalCurrency
    });
    const payment = await prepareExternalPayment(
      story.id,
      order.orderId,
      toPaymentMinorUnits(config.paypalAmount, config.paypalCurrency)
    );

    if (!payment) {
      await recordAnalyticsEventSafely({
        eventName: "payment_failed",
        storyId: story.id,
        metadata: { provider: "paypal", reason: "prepare_failed" }
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
        orderId: order.orderId,
        provider: "paypal"
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId: story.id,
      metadata: {
        message:
          error instanceof Error ? error.message : "PayPal order creation failed.",
        provider: "paypal"
      }
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "PayPal order creation failed."
      },
      { status: 502 }
    );
  }
}
