import { NextResponse } from "next/server";
import { z } from "zod";
import { ChoiceIdSchema } from "@/lib/story/schema";
import { chooseStoryDirection } from "@/lib/story/persistence";

const SelectChoiceRequestSchema = z.object({
  storyId: z.string().uuid(),
  choiceId: ChoiceIdSchema
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

  const parsed = SelectChoiceRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "선택 정보를 확인해 주세요." },
      { status: 400 }
    );
  }

  const story = await chooseStoryDirection(parsed.data.storyId, parsed.data.choiceId);

  if (!story) {
    return NextResponse.json(
      { error: "스토리 또는 선택지를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    storyId: story.id,
    selectedChoiceId: story.selectedChoiceId,
    status: story.status
  });
}
