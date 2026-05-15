import { describe, expect, it } from "vitest";
import { moderateStoryInput } from "./moderation";
import type { StoryInput } from "./schema";

const baseInput: StoryInput = {
  breakupMoment: "마지막 통화",
  breakupReason: "서로의 오해",
  alternativeChoice: "그때 침묵하지 않고 미안하다는 말을 먼저 꺼내고 싶었다.",
  emotion: "regret",
  desiredEnding: "growth",
  protagonistAlias: "나",
  partnerAlias: "그 사람",
  agreedToFictionNotice: true,
  agreedToPrivacyNotice: true
};

describe("moderateStoryInput", () => {
  it("allows safe breakup reflection text", () => {
    const result = moderateStoryInput(baseInput);

    expect(result.allowed).toBe(true);
    expect(result.categories).toEqual([]);
  });

  it("blocks self-harm expressions", () => {
    const result = moderateStoryInput({
      ...baseInput,
      alternativeChoice: "헤어진 뒤 죽고 싶다는 생각만 했다."
    });

    expect(result.allowed).toBe(false);
    expect(result.categories).toContain("self_harm");
  });

  it("blocks stalking expressions", () => {
    const result = moderateStoryInput({
      ...baseInput,
      alternativeChoice: "상대 회사 앞에서 몰래 따라가고 싶었다."
    });

    expect(result.allowed).toBe(false);
    expect(result.categories).toContain("stalking");
  });

  it("blocks threat expressions", () => {
    const result = moderateStoryInput({
      ...baseInput,
      alternativeChoice: "상대에게 복수하고 가만두지 않겠다고 말하고 싶었다."
    });

    expect(result.allowed).toBe(false);
    expect(result.categories).toContain("threat");
  });

  it("blocks phone numbers and redacts them from sanitized input", () => {
    const result = moderateStoryInput({
      ...baseInput,
      alternativeChoice: "010-1234-5678로 연락해서 마지막 말을 하고 싶었다."
    });

    expect(result.allowed).toBe(false);
    expect(result.categories).toContain("personal_data");
    expect(result.sanitizedInput.alternativeChoice).toContain("[연락처 삭제]");
  });
});
