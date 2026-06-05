import { NextResponse } from "next/server";
import { z } from "zod";
import { ChoiceIdSchema } from "@/lib/story/schema";
import {
  chooseStoryDirection,
  recordAnalyticsEventSafely
} from "@/lib/story/persistence";

const SelectChoiceRequestSchema = z.object({
  storyId: z.string().uuid(),
  choiceId: ChoiceIdSchema,
  customChoiceText: z.string().trim().min(5).max(160).optional()
});

const unsafeCustomChoicePattern =
  /(연락|전화|문자|카톡|주소|집\s*앞|직장|찾아가|몰래|기다리|협박|복수|죽|자해|\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4})/i;

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

  if (
    parsed.data.customChoiceText &&
    unsafeCustomChoicePattern.test(parsed.data.customChoiceText)
  ) {
    return NextResponse.json(
      {
        error:
          "직접 입력한 결말은 연락, 찾아가기, 개인정보, 협박, 자해 표현 없이 감정 변화나 장면 중심으로 적어 주세요."
      },
      { status: 400 }
    );
  }

  const story = await chooseStoryDirection(
    parsed.data.storyId,
    parsed.data.choiceId,
    parsed.data.customChoiceText
  );

  if (!story) {
    return NextResponse.json(
      { error: "스토리 또는 선택지를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  await recordAnalyticsEventSafely({
    eventName: "choice_selected",
    storyId: story.id,
    metadata: {
      choiceId: story.selectedChoiceId,
      hasCustomChoice: Boolean(parsed.data.customChoiceText)
    }
  });

  return NextResponse.json({
    storyId: story.id,
    selectedChoiceId: story.selectedChoiceId,
    status: story.status
  });
}
