import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config/runtime";
import { capturePayPalOrder } from "@/lib/payment/paypal";
import {
  completeMockPaidStory,
  completePreparedPaidStory
} from "@/lib/story/persistence";

const CapturePayPalOrderRequestSchema = z.object({
  storyId: z.string().uuid(),
  orderId: z.string().min(4)
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = CapturePayPalOrderRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
  }

  const config = getRuntimeConfig();

  try {
    if (config.mockPayPal) {
      const completed = await completeMockPaidStory(parsed.data.storyId);

      if (!completed) {
        return NextResponse.json(
          { error: "PayPal mock payment could not be completed." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        storyId: completed.id,
        status: completed.status,
        chapterCount: completed.story.chapters.length,
        mock: true
      });
    }

    const capture = await capturePayPalOrder(parsed.data.orderId);

    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "PayPal payment has not completed.", payPalStatus: capture.status },
        { status: 400 }
      );
    }

    const completed = await completePreparedPaidStory(parsed.data.storyId);

    if (!completed) {
      return NextResponse.json(
        { error: "Paid chapters could not be generated." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      storyId: completed.id,
      status: completed.status,
      chapterCount: completed.story.chapters.length,
      payPalOrderId: capture.orderId
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "PayPal capture failed."
      },
      { status: 502 }
    );
  }
}
