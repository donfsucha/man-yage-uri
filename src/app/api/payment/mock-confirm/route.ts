import { NextResponse } from "next/server";
import { z } from "zod";
import { completeMockPaidStory } from "@/lib/story/persistence";

const MockConfirmRequestSchema = z.object({
  storyId: z.string().uuid()
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

  const parsed = MockConfirmRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "결제 정보를 확인해주세요." },
      { status: 400 }
    );
  }

  const completed = await completeMockPaidStory(parsed.data.storyId);

  if (!completed) {
    return NextResponse.json(
      { error: "결제 준비 또는 완결 회차 생성에 실패했습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    storyId: completed.id,
    status: completed.status,
    chapterCount: completed.story.chapters.length
  });
}
