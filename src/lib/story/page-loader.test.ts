import { afterEach, describe, expect, it, vi } from "vitest";
import { getStoryForPage } from "./page-loader";

const getStory = vi.fn();
const getRuntimeConfig = vi.fn();

vi.mock("@/lib/story/persistence", () => ({
  getStory: (id: string) => getStory(id)
}));

vi.mock("@/lib/config/runtime", () => ({
  getRuntimeConfig: () => getRuntimeConfig()
}));

describe("getStoryForPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    getStory.mockReset();
    getRuntimeConfig.mockReset();
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  });

  it("returns the directly loaded story when available", async () => {
    const stored = { id: "story-1" };
    getStory.mockResolvedValue(stored);

    await expect(getStoryForPage("story-1")).resolves.toBe(stored);
  });

  it("falls back to the story API when direct page loading returns null", async () => {
    const stored = { id: "story-2" };
    getStory.mockResolvedValue(null);
    getRuntimeConfig.mockReturnValue({ appUrl: "https://ifwe.cnanfc.com/" });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ story: stored }), { status: 200 })
      );

    await expect(getStoryForPage("story-2")).resolves.toEqual(stored);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ifwe.cnanfc.com/api/story/story-2",
      { cache: "no-store" }
    );
  });

  it("uses the Vercel URL when appUrl is still localhost", async () => {
    const stored = { id: "story-3" };
    getStory.mockRejectedValue(new Error("direct load failed"));
    getRuntimeConfig.mockReturnValue({ appUrl: "http://localhost:3000" });
    process.env.VERCEL_URL = "man-yage-uri.vercel.app";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ story: stored }), { status: 200 })
      );

    await expect(getStoryForPage("story-3")).resolves.toEqual(stored);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ifwe.cnanfc.com/api/story/story-3",
      { cache: "no-store" }
    );
  });
});
