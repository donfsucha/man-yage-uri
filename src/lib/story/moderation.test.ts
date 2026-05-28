import { describe, expect, it } from "vitest";
import { moderateStoryInput } from "./moderation";
import type { StoryInput } from "./schema";

const baseInput: StoryInput = {
  breakupMoment: "마지막 통화",
  breakupReason: "서로의 오해",
  alternativeChoice: "그때 화내지 않고 미안하다는 말을 먼저 꺼내고 싶었어.",
  lastScenePlace: "비 오는 정류장",
  rememberedDetail: "젖은 운동화 끈과 꺼지지 않던 휴대폰 화면",
  partnerBehavior: "화가 나면 대답보다 침묵이 먼저 길어지는 편",
  emotion: "regret",
  desiredEnding: "growth",
  protagonistAlias: "하린",
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
      alternativeChoice: "헤어진 뒤 죽고 싶다는 생각만 들었다."
    });

    expect(result.allowed).toBe(false);
    expect(result.categories).toContain("self_harm");
  });

  it("blocks stalking expressions", () => {
    const result = moderateStoryInput({
      ...baseInput,
      alternativeChoice: "상대 회사 앞에서 몰래 따라가고 싶었어."
    });

    expect(result.allowed).toBe(false);
    expect(result.categories).toContain("stalking");
  });

  it("blocks threat expressions", () => {
    const result = moderateStoryInput({
      ...baseInput,
      alternativeChoice: "상대에게 복수하고 가만두지 않겠다고 말하고 싶었어."
    });

    expect(result.allowed).toBe(false);
    expect(result.categories).toContain("threat");
  });

  it("blocks phone numbers and redacts them from sanitized input", () => {
    const result = moderateStoryInput({
      ...baseInput,
      rememberedDetail: "010-1234-5678이 적힌 영수증이 아직 남아 있어."
    });

    expect(result.allowed).toBe(false);
    expect(result.categories).toContain("personal_data");
    expect(result.sanitizedInput.rememberedDetail).toContain("[연락처 삭제]");
  });

  it("checks newly added scene fields for unsafe content", () => {
    const result = moderateStoryInput({
      ...baseInput,
      lastScenePlace: "상대 회사 앞에서 몰래 기다리던 밤"
    });

    expect(result.allowed).toBe(false);
    expect(result.categories).toContain("stalking");
  });
});
