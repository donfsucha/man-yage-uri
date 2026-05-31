import { NextResponse } from "next/server";
import { moderateStoryInput } from "@/lib/story/moderation";
import { StoryInputSchema } from "@/lib/story/schema";
import { createPreview } from "@/lib/story/persistence";

export const dynamic = "force-dynamic";

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

  const parsedInput = StoryInputSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        error: "입력값을 확인해 주세요.",
        issues: parsedInput.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const moderation = moderateStoryInput(parsedInput.data);

  if (!moderation.allowed) {
    return NextResponse.json(
      {
        error:
          parsedInput.data.outputLanguage === "en"
            ? "This input is difficult to turn into safe fiction. Please remove self-harm, threats, surveillance, attempts to visit/contact, or personal information. If these feelings continue, consider reaching out to someone you trust or a professional support service."
            : moderation.message,
        categories: moderation.categories
      },
      { status: 400 }
    );
  }

  try {
    const stored = await createPreview(moderation.sanitizedInput);

    return NextResponse.json({
      storyId: stored.id,
      story: stored.story
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "스토리 생성 또는 저장에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
