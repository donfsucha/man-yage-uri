import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const recordAnalyticsEvent = vi.fn();

vi.mock("@/lib/story/persistence", () => ({
  recordAnalyticsEvent: (...args: unknown[]) => recordAnalyticsEvent(...args)
}));

function request(body: unknown) {
  return new Request("http://localhost/api/events/track", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

describe("analytics event tracking API", () => {
  it("accepts tracking requests even when analytics storage fails", async () => {
    recordAnalyticsEvent.mockRejectedValueOnce(new Error("fetch failed"));
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await POST(
      request({
        eventName: "story_start",
        metadata: { page: "create" }
      })
    );

    await expect(response.json()).resolves.toEqual({
      accepted: true,
      analyticsStored: false
    });
    expect(response.status).toBe(202);
    consoleWarn.mockRestore();
  });
});
