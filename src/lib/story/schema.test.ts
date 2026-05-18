import { describe, expect, it } from "vitest";
import { PreviewStorySchema } from "./schema";

const validPreview = {
  title: "우리가 헤어지지 않았던 밤",
  genre: "평행세계 로맨스",
  emotional_tone: "감성적이고 담담함",
  summary:
    "마지막 통화에서 주인공이 침묵하지 않고 진심을 말하면서 이야기가 달라진다.",
  chapters: [
    {
      chapter_no: 1,
      chapter_title: "끊기지 않은 전화",
      body:
        "전화가 끊기기 직전, 나는 처음으로 침묵을 깨고 말했다. 말끝은 조금 떨렸지만 그 떨림 안에는 오래 미뤄둔 진심이 있었다. 우리는 서로를 설득하지 않고 그날 밤에 남아 있던 마음을 천천히 꺼내 놓았다.",
      ending_hook:
        "그의 숨소리가 멈췄고 나는 그가 울고 있다는 걸 알았다."
    }
  ],
  next_choices: [
    { choice_id: "A", label: "다시 만날 약속을 잡는다" },
    { choice_id: "B", label: "서로의 오해를 천천히 풀어간다" },
    { choice_id: "C", label: "마지막 하루를 함께 보낸다" }
  ],
  safety_flags: {
    contains_self_harm_risk: false,
    contains_stalking_risk: false,
    requires_manual_review: false
  }
};

describe("PreviewStorySchema", () => {
  it("accepts a valid preview story response", () => {
    expect(PreviewStorySchema.safeParse(validPreview).success).toBe(true);
  });

  it("rejects a preview response without next choices", () => {
    const result = PreviewStorySchema.safeParse({
      ...validPreview,
      next_choices: undefined
    });

    expect(result.success).toBe(false);
  });

  it("rejects preview responses that do not contain chapter 1", () => {
    const result = PreviewStorySchema.safeParse({
      ...validPreview,
      chapters: [{ ...validPreview.chapters[0], chapter_no: 2 }]
    });

    expect(result.success).toBe(false);
  });
});
