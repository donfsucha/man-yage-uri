import { getRuntimeConfig } from "@/lib/config/runtime";
import { getStory } from "@/lib/story/persistence";
import type { StoredPreviewStory } from "@/lib/story/schema";

type StoryApiResponse = {
  story?: StoredPreviewStory;
};

function getPageApiBaseUrl() {
  const configuredUrl = getRuntimeConfig().appUrl.replace(/\/$/, "");
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "";

  if (configuredUrl && configuredUrl !== "http://localhost:3000") {
    return configuredUrl;
  }

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "";
}

async function fetchStoryFromApi(id: string) {
  const appUrl = getPageApiBaseUrl();

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
  try {
    const stored = await getStory(id);

    if (stored) {
      return stored;
    }
  } catch {
    // Fall through to the API route, which can succeed in Vercel runtimes where
    // direct page-level Supabase hydration is unavailable.
  }

  return fetchStoryFromApi(id);
}
