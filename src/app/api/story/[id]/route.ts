import { NextResponse } from "next/server";
import { getStory } from "@/lib/story/persistence";

type StoryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: StoryRouteContext) {
  const { id } = await context.params;
  const story = await getStory(id);

  if (!story) {
    return NextResponse.json(
      { error: "스토리를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ story });
}
