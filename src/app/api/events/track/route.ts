import { NextResponse } from "next/server";
import { z } from "zod";
import { AnalyticsEventNameSchema } from "@/lib/story/schema";
import { recordAnalyticsEvent } from "@/lib/story/persistence";

const TrackEventRequestSchema = z.object({
  eventName: AnalyticsEventNameSchema,
  storyId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문을 읽을 수 없습니다." },
      { status: 400 }
    );
  }

  const parsed = TrackEventRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "이벤트 정보를 확인해 주세요." },
      { status: 400 }
    );
  }

  try {
    const event = await recordAnalyticsEvent({
      eventName: parsed.data.eventName,
      storyId: parsed.data.storyId ?? null,
      metadata: parsed.data.metadata ?? {}
    });

    return NextResponse.json({ eventId: event.id });
  } catch (error) {
    console.warn(
      "Analytics event could not be recorded.",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      {
        accepted: true,
        analyticsStored: false
      },
      { status: 202 }
    );
  }
}
