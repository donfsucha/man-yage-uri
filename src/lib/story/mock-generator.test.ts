import { describe, expect, it } from "vitest";
import { generateMockPreview } from "./mock-generator";
import type { StoryInput } from "./schema";

const input: StoryInput = {
  breakupMoment: "마지막 통화",
  breakupReason: "서로의 오해",
  alternativeChoice: "그때 침묵하지 않고 미안하다는 말을 먼저 꺼내고 싶었다.",
  emotion: "regret",
  desiredEnding: "growth",
  protagonistAlias: "하린",
  partnerAlias: "그 사람",
  agreedToFictionNotice: true,
  agreedToPrivacyNotice: true
};

describe("generateMockPreview", () => {
  it("uses natural Korean particles in generated preview copy", () => {
    const story = generateMockPreview(input);
    const combined = [story.summary, story.chapters[0].body, story.chapters[0].ending_hook].join(
      "\n"
    );

    expect(combined).not.toContain("은(는)");
    expect(combined).toContain("마지막 통화는");
    expect(combined).toContain("하린은");
    expect(combined).toContain("그 사람은");
  });
});
