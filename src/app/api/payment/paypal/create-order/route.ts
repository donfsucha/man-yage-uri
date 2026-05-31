import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config/runtime";
import { createPayPalOrder, toPaymentMinorUnits } from "@/lib/payment/paypal";
import { getStory, prepareExternalPayment } from "@/lib/story/persistence";

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
      return NextResponse.json(
        { error: "Payment could not be prepared." },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "PayPal order creation failed."
      },
      { status: 502 }
    );
  }
}
