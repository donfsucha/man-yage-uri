import { describe, expect, it } from "vitest";
import {
  countReadableChars,
  estimateMobilePages,
  getStoryLengthStats,
  LONG_FORM_TARGETS
} from "./story-length";
import type { PreviewStory } from "./schema";

describe("story length helpers", () => {
  it("estimates mobile pages from Korean character count", () => {
    expect(estimateMobilePages("가".repeat(1100))).toBe(2);
  });

  it("does not count whitespace padding as readable story length", () => {
    expect(countReadableChars(`짧은 문장\n\n\n${" ".repeat(1000)}`)).toBe(4);
  });

  it("summarizes full story length for reader screens", () => {
    const story: PreviewStory = {
      title: "다른 마지막",
      genre: "각자의 성장",
      emotional_tone: "차분한 긴장",
      summary: "서로의 마지막 장면을 안전한 픽션으로 다시 바라본다.",
      chapters: [
        {
          chapter_no: 1,
          chapter_title: "다시 열린 장면",
          body: "가".repeat(4000),
          ending_hook: "다음 장면을 궁금하게 만드는 마지막 문장."
        }
      ],
      scenes: [
        {
          scene_no: 1,
          scene_title: "정류장",
          setting: "비 오는 정류장",
          body: "나".repeat(500),
          dialogue: "잠깐만, 이번에는 말할게.",
          visual_prompt: "Korean emotional mobile web novel scene card",
          emotion: "후회와 용기"
        },
        {
          scene_no: 2,
          scene_title: "침묵",
          setting: "젖은 횡단보도",
          body: "다".repeat(500),
          dialogue: "네 마음을 내가 정하지는 않을게.",
          visual_prompt: "Korean emotional mobile web novel scene card",
          emotion: "불안과 거리감"
        },
        {
          scene_no: 3,
          scene_title: "문장",
          setting: "닫히는 카페",
          body: "라".repeat(500),
          dialogue: "미안하다는 말을 먼저 꺼내고 싶었어.",
          visual_prompt: "Korean emotional mobile web novel scene card",
          emotion: "진심"
        }
      ],
      next_choices: [
        { choice_id: "A", label: "오해를 하나씩 풀어본다" },
        { choice_id: "B", label: "마지막 하루를 함께 보낸다" },
        { choice_id: "C", label: "각자의 진심을 편지로 남긴다" }
      ],
      safety_flags: {
        contains_self_harm_risk: false,
        contains_stalking_risk: false,
        requires_manual_review: false
      }
    };

    const stats = getStoryLengthStats(story);

    expect(stats.totalChars).toBeGreaterThan(5500);
    expect(stats.estimatedPages).toBeGreaterThanOrEqual(10);
    expect(LONG_FORM_TARGETS.fullStory.minPages).toBe(80);
  });
});
