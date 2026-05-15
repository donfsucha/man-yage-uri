import { NextResponse } from "next/server";
import { z } from "zod";
import { removeStory } from "@/lib/story/persistence";

const DeleteDataRequestSchema = z.object({
  storyId: z.string().uuid()
});

export async function DELETE(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문을 읽을 수 없습니다." },
      { status: 400 }
    );
  }

  const parsed = DeleteDataRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "삭제할 스토리 정보를 확인해주세요." },
      { status: 400 }
    );
  }

  const deleted = await removeStory(parsed.data.storyId);

  if (!deleted) {
    return NextResponse.json(
      { error: "삭제할 스토리를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ deleted: true });
}
