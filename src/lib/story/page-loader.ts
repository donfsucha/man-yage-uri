import { getRuntimeConfig } from "@/lib/config/runtime";
import { getStory } from "@/lib/story/persistence";
import type { StoredPreviewStory } from "@/lib/story/schema";

type StoryApiResponse = {
  story?: StoredPreviewStory;
};

async function fetchStoryFromApi(id: string) {
  const appUrl = getRuntimeConfig().appUrl.replace(/\/$/, "");

  if (!appUrl) {
    return null;
  }

  try {
    const response = await fetch(`${appUrl}/api/story/${id}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as StoryApiResponse;
    return payload.story ?? null;
  } catch {
    return null;
  }
}

export async function getStoryForPage(id: string) {
  const stored = await getStory(id);

  if (stored) {
    return stored;
  }

  return fetchStoryFromApi(id);
}
