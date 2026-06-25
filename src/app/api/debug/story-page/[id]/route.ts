import { NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/config/runtime";
import { getStoryForPage } from "@/lib/story/page-loader";
import { getStory } from "@/lib/story/persistence";

type DebugStoryPageRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: DebugStoryPageRouteContext) {
  const { id } = await context.params;
  const config = getRuntimeConfig();
  let directFound = false;
  let directError = "";

  try {
    directFound = Boolean(await getStory(id));
  } catch (error) {
    directError = error instanceof Error ? error.message : "unknown";
  }

  const fallbackStory = await getStoryForPage(id);

  return NextResponse.json({
    appUrl: config.appUrl,
    directError,
    directFound,
    fallbackFound: Boolean(fallbackStory),
    id,
    mockSupabase: config.mockSupabase,
    title: fallbackStory?.story.title ?? null
  });
}
