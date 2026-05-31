import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { moderateStoryInput } from "@/lib/story/moderation";
import type { StoryInput } from "@/lib/story/schema";

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

describe("create page copy", () => {
  it("uses last scene place examples that pass moderation", () => {
    const pagePath = join(process.cwd(), "src", "app", "create", "page.tsx");
    const source = readFileSync(pagePath, "utf8");
    const match = source.match(/lastScenePlacePlaceholder:\s*"([^"]*비 오는 정류장[^"]*)"/);

    expect(match).not.toBeNull();

    const examples = match?.[1]
      .replace(/^예:\s*/, "")
      .split(",")
      .map((example) => example.trim());

    expect(examples).toBeDefined();
    for (const example of examples ?? []) {
      expect(
        moderateStoryInput({
          ...baseInput,
          lastScenePlace: example
        }).allowed
      ).toBe(true);
    }
  });
});
