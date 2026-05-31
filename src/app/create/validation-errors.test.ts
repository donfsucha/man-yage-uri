import { describe, expect, it } from "vitest";
import { formatStoryInputIssues, getLocalStoryInputIssue } from "./validation-errors";

describe("formatStoryInputIssues", () => {
  it("shows field names and minimum hints for invalid story input", () => {
    expect(
      formatStoryInputIssues({
        alternativeChoice: ["Too small"],
        lastScenePlace: ["Too small"],
        agreedToPrivacyNotice: ["Invalid input"]
      })
    ).toBe(
      "다음 항목을 확인해 주세요: 그때 다르게 하고 싶었던 말이나 행동(5자 이상), 마지막 장면의 장소(2자 이상), 개인정보 미입력 동의(체크 필요)"
    );
  });

  it("falls back to the generic message when no field issue exists", () => {
    expect(formatStoryInputIssues({})).toBe("입력값을 확인해 주세요.");
  });

  it("formats validation messages in English", () => {
    expect(
      formatStoryInputIssues(
        {
          alternativeChoice: ["Too small"],
          agreedToPrivacyNotice: ["Invalid input"]
        },
        "en"
      )
    ).toBe(
      "Please check: What you wish you had said or done(at least 5 characters), Privacy notice agreement(required)"
    );
  });

  it("returns the first local field that prevents generation", () => {
    expect(
      getLocalStoryInputIssue({
        alternativeChoice: "미안",
        lastScenePlace: "비 오는 정류장",
        rememberedDetail: "젖은 운동화 끈",
        partnerBehavior: "침묵이 길어짐",
        protagonistAlias: "김림",
        partnerAlias: "예림",
        agreedToFictionNotice: true,
        agreedToPrivacyNotice: true
      })
    ).toEqual({
      fieldId: "alternativeChoice",
      message: "그때 다르게 하고 싶었던 말이나 행동을 5자 이상으로 입력해 주세요."
    });
  });

  it("returns null when local generation inputs are ready", () => {
    expect(
      getLocalStoryInputIssue({
        alternativeChoice: "미안하다고 먼저 말하고 싶었어",
        lastScenePlace: "비 오는 정류장",
        rememberedDetail: "젖은 운동화 끈",
        partnerBehavior: "침묵이 길어짐",
        protagonistAlias: "김림",
        partnerAlias: "예림",
        agreedToFictionNotice: true,
        agreedToPrivacyNotice: true
      })
    ).toBeNull();
  });

  it("returns local validation issues in English", () => {
    expect(
      getLocalStoryInputIssue(
        {
          alternativeChoice: "no",
          lastScenePlace: "rainy bus stop",
          rememberedDetail: "wet shoelaces",
          partnerBehavior: "went quiet before answering",
          protagonistAlias: "Harin",
          partnerAlias: "Yerim",
          agreedToFictionNotice: true,
          agreedToPrivacyNotice: true
        },
        "en"
      )
    ).toEqual({
      fieldId: "alternativeChoice",
      message:
        "Please enter What you wish you had said or done: at least 5 characters."
    });
  });
});
