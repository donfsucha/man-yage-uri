import { beforeEach, describe, expect, it, vi } from "vitest";

const createPreview = vi.fn();
const recordAnalyticsEventSafely = vi.fn();

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
      outputLanguage: "ko",
      breakupMoment: "문자로 끝난 밤",
      breakupReason: "서로 미안하다는 말을 미뤘기 때문",
      alternativeChoice: "화내지 않고 먼저 미안하다고 말하고 싶었어",
      lastScenePlace: "늦은 밤 카페 앞",
      rememberedDetail: "식은 라떼와 읽음 표시",
      partnerBehavior: "답장을 쓰다 지우기를 반복했다",
      emotion: "regret",
      desiredEnding: "growth",
      protagonistAlias: "기림",
      partnerAlias: "예림",
      agreedToFictionNotice: true,
      agreedToPrivacyNotice: true
    })
  });
}

describe("generate-preview API", () => {
  beforeEach(() => {
    createPreview.mockReset();
    recordAnalyticsEventSafely.mockReset();
  });

  it("returns a safe configuration error when Supabase credentials are missing", async () => {
    createPreview.mockRejectedValue(
      new Error("Supabase service credentials are not configured.")
    );
    const { POST } = await import("./route");

    const response = await POST(validRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      code: "server_configuration_missing",
      error:
        "운영 저장 설정이 아직 연결되지 않았습니다. 관리자에게 Supabase 환경변수 설정을 요청해 주세요."
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