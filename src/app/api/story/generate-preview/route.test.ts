import { beforeEach, describe, expect, it, vi } from "vitest";

const createPreview = vi.fn();
const getRuntimeConfig = vi.fn();
const recordAnalyticsEventSafely = vi.fn();

vi.mock("@/lib/config/runtime", () => ({
  getRuntimeConfig: () => getRuntimeConfig()
}));

vi.mock("@/lib/story/persistence", () => ({
  createPreview: (...args: unknown[]) => createPreview(...args),
  recordAnalyticsEventSafely: (...args: unknown[]) =>
    recordAnalyticsEventSafely(...args)
}));

function validRequest() {
  return new Request("http://localhost/api/story/generate-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      outputLanguage: "en",
      breakupMoment: "the night it ended by text",
      breakupReason: "we kept delaying the apology",
      alternativeChoice: "I wanted to say sorry first instead of acting angry",
      lastScenePlace: "outside a late night cafe",
      rememberedDetail: "a cold latte and a read receipt",
      partnerBehavior: "typed and erased the reply again",
      emotion: "regret",
      desiredEnding: "growth",
      protagonistAlias: "Girim",
      partnerAlias: "Yerim",
      agreedToFictionNotice: true,
      agreedToPrivacyNotice: true
    })
  });
}

describe("generate-preview API", () => {
  beforeEach(() => {
    createPreview.mockReset();
    getRuntimeConfig.mockReset();
    recordAnalyticsEventSafely.mockReset();
    getRuntimeConfig.mockReturnValue({
      mockSupabase: false,
      supabaseServiceRoleKey: "",
      supabaseUrl: ""
    });
  });

  it("returns a safe configuration error before generation when Supabase credentials are missing", async () => {
    const { POST } = await import("./route");

    const response = await POST(validRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(createPreview).not.toHaveBeenCalled();
    expect(body).toEqual({
      code: "server_configuration_missing",
      error:
        "The production storage settings are not connected yet. Please contact the site administrator."
    });
    expect(recordAnalyticsEventSafely).toHaveBeenCalledWith({
      eventName: "preview_failed",
      metadata: {
        code: "server_configuration_missing",
        message: "Supabase service credentials are not configured."
      }
    });
  });
});