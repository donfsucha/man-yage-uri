import { describe, expect, it } from "vitest";
import { PreviewStorySchema, StoryInputSchema } from "./schema";

const validInput = {
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
        "그의 숨소리가 멈췄고 나는 그가 울고 있다는 걸 알았다.",
      next_choices: [
        { choice_id: "A", label: "바로 묻지 않고 기다린다" },
        { choice_id: "B", label: "못 들은 말을 조심스럽게 꺼낸다" },
        { choice_id: "C", label: "더 붙잡지 않겠다고 먼저 말한다" }
      ]
    }
  ],
  scenes: [
    {
      scene_no: 1,
      scene_title: "끊기지 않은 전화",
      setting: "비 오는 정류장, 꺼지지 않는 휴대폰 화면 앞",
      body:
        "전화가 끊기기 직전, 나는 처음으로 침묵을 깨고 말했다. 빗물이 운동화 끈에 스며드는 감각이 이상하게 선명했고, 그 작은 감각 때문에 도망치고 싶던 마음도 잠깐 멈췄다.",
      dialogue: "잠깐만, 나 이번에는 도망치지 않고 말할게.",
      visual_prompt:
        "Korean emotional fiction card, rainy bus stop, phone screen glowing, wet shoelace detail, cinematic but warm",
      emotion: "후회와 용기가 같이 올라오는 장면"
    },
    {
      scene_no: 2,
      scene_title: "침묵의 모양",
      setting: "통화 너머로 숨소리만 들리는 밤",
      body:
        "그 사람은 늘 그랬듯 한동안 아무 말도 하지 않았다. 예전의 나는 그 침묵을 거절로만 받아들였지만, 이번 장면의 나는 그 침묵을 밀어붙이지 않고 기다렸다.",
      dialogue: "대답 안 해도 괜찮아. 대신 내가 짐작하지는 않을게.",
      visual_prompt:
        "quiet night phone call, empty room, soft light, realistic Korean web novel illustration",
      emotion: "불안하지만 안전한 거리감"
    },
    {
      scene_no: 3,
      scene_title: "다른 선택",
      setting: "비가 조금 잦아든 정류장",
      body:
        "나는 화내지 않고 미안하다는 말을 먼저 꺼냈다. 그 말은 관계를 되돌리는 주문이 아니라, 내가 내 마음을 함부로 버려두지 않기 위한 문장이었다.",
      dialogue: "미안해. 그날 나는 상처받은 척만 하느라 네 말을 듣지 못했어.",
      visual_prompt:
        "rain easing at bus stop, two silhouettes apart, paper novel card composition",
      emotion: "후회에서 정리로 넘어가는 장면"
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
  it("requires concrete scene inputs for a more realistic story seed", () => {
    expect(StoryInputSchema.safeParse(validInput).success).toBe(true);

    const result = StoryInputSchema.safeParse({
      ...validInput,
      rememberedDetail: undefined
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid preview story response", () => {
    expect(PreviewStorySchema.safeParse(validPreview).success).toBe(true);
  });

  it("rejects a preview response without scene cards", () => {
    const result = PreviewStorySchema.safeParse({
      ...validPreview,
      scenes: undefined
    });

    expect(result.success).toBe(false);
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

  it("accepts per-chapter choices for serial story pacing", () => {
    const result = PreviewStorySchema.safeParse(validPreview);

    expect(result.success).toBe(true);
    expect(result.success ? result.data.chapters[0].next_choices : []).toHaveLength(3);
  });
});
