import { getRuntimeConfig } from "@/lib/config/runtime";
import { getStory } from "@/lib/story/persistence";
import type { StoredPreviewStory } from "@/lib/story/schema";

type StoryApiResponse = {
  story?: StoredPreviewStory;
};

const IFWE_PRODUCTION_URL = "https://ifwe.cnanfc.com";

function getPageApiBaseUrl() {
  const configuredUrl = getRuntimeConfig().appUrl.replace(/\/$/, "");

  if (configuredUrl && configuredUrl !== "http://localhost:3000") {
    return configuredUrl;
  }

  return IFWE_PRODUCTION_URL;
}

async function fetchStoryFromApi(id: string) {
  const appUrl = getPageApiBaseUrl();

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
