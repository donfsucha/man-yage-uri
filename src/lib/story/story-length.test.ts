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
    expect(estimateMobilePages("a".repeat(1100))).toBe(2);
  });

  it("does not count whitespace padding as readable story length", () => {
    expect(countReadableChars(`real text\n\n\n${" ".repeat(1000)}`)).toBe(8);
  });

  it("summarizes full story length for reader screens", () => {
    const story: PreviewStory = {
      title: "Different Last Scene",
      genre: "emotional growth",
      emotional_tone: "quiet tension",
      summary: "A fictional story revisits the final breakup scene safely.",
      chapters: [
        {
          chapter_no: 1,
          chapter_title: "The Scene Opens Again",
          body: "a".repeat(1800),
          ending_hook: "A final sentence that makes the next scene feel necessary."
        }
      ],
      scenes: [
        {
          scene_no: 1,
          scene_title: "Station",
          setting: "Rainy bus stop",
          body: "b".repeat(300),
          dialogue: "This time, I will say it differently.",
          visual_prompt: "Korean emotional mobile web novel scene card",
          emotion: "regret"
        },
        {
          scene_no: 2,
          scene_title: "Silence",
          setting: "Crosswalk",
          body: "c".repeat(300),
          dialogue: "I did not know how heavy silence could become.",
          visual_prompt: "Korean emotional mobile web novel scene card",
          emotion: "distance"
        },
        {
          scene_no: 3,
          scene_title: "Sentence",
          setting: "Closed cafe",
          body: "d".repeat(300),
          dialogue: "I should have said sorry first.",
          visual_prompt: "Korean emotional mobile web novel scene card",
          emotion: "truth"
        }
      ],
      next_choices: [
        { choice_id: "A", label: "Name the misunderstanding" },
        { choice_id: "B", label: "Spend one final day together" },
        { choice_id: "C", label: "Leave the truth in a letter" }
      ],
      safety_flags: {
        contains_self_harm_risk: false,
        contains_stalking_risk: false,
        requires_manual_review: false
      }
    };

    const stats = getStoryLengthStats(story);

    expect(stats.totalChars).toBeGreaterThan(2600);
    expect(stats.estimatedPages).toBeGreaterThanOrEqual(5);
    expect(LONG_FORM_TARGETS.freePreview.minPages).toBe(4);
    expect(LONG_FORM_TARGETS.freePreview.maxPages).toBe(8);
    expect(LONG_FORM_TARGETS.fullStory.targetPages).toBe(50);
    expect(LONG_FORM_TARGETS.fullStory.minPages).toBe(45);
    expect(LONG_FORM_TARGETS.fullStory.maxPages).toBe(55);
  });
});
