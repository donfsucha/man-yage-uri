import { describe, expect, it } from "vitest";
import { generateMockPaidChapters, generateMockPreview } from "./mock-generator";
import type { NextChoice, StoryInput } from "./schema";
import { countReadableChars, LONG_FORM_TARGETS } from "./story-length";

const input: StoryInput = {
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

function textLength(value: string) {
  return countReadableChars(value);
}

function paragraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

describe("generateMockPreview", () => {
  it("uses natural Korean particles in generated preview copy", () => {
    const story = generateMockPreview(input);
    const combined = [
      story.summary,
      story.chapters[0].body,
      story.chapters[0].ending_hook,
      ...story.scenes.map((scene) => `${scene.setting}\n${scene.body}`)
    ].join("\n");

    expect(combined).not.toContain("?");
    expect(combined).not.toContain("마지막 통화이");
    expect(combined).not.toContain("마지막 통화은");
    expect(combined).not.toContain("편였다");
    expect(combined).not.toContain("은도");
    expect(combined).toContain("마지막 통화에서");
    expect(combined).toContain("하린은");
    expect(combined).toContain("그 사람은");
  });

  it("creates scene cards from place, detail, and partner behavior", () => {
    const story = generateMockPreview(input);
    const combinedScenes = story.scenes
      .map((scene) => `${scene.setting}\n${scene.body}\n${scene.dialogue}`)
      .join("\n");

    expect(story.scenes).toHaveLength(5);
    expect(combinedScenes).toContain("비 오는 정류장");
    expect(combinedScenes).toContain("젖은 운동화 끈");
    expect(combinedScenes).toContain("침묵");
    expect(story.scenes[0].visual_prompt).toContain("Korean");
  });

  it("turns adjective-like remembered details into a natural person description", () => {
    const story = generateMockPreview({
      ...input,
      protagonistAlias: "기림",
      partnerAlias: "예림",
      rememberedDetail: "웃는 보조개가 예뻐"
    });
    const combined = [
      story.summary,
      story.chapters[0].body,
      ...story.scenes.map((scene) => `${scene.setting}\n${scene.body}`)
    ].join("\n");

    expect(combined).not.toContain("예뻐이");
    expect(combined).not.toContain("예뻐은");
    expect(combined).toContain("웃는 보조개가 예쁜 예림이 눈에 들어오자");
  });

  it("turns casual past behavior into a natural remembered action", () => {
    const story = generateMockPreview({
      ...input,
      protagonistAlias: "기림",
      partnerAlias: "예림",
      partnerBehavior: "귀를 자주 만졌어"
    });
    const combined = [
      story.chapters[0].body,
      ...story.scenes.map((scene) => scene.body)
    ].join("\n");

    expect(combined).not.toContain("귀를 자주 만졌어 모습을 보였다");
    expect(combined).toContain("예림은 늘 귀를 자주 만졌던 모습을 보였다");
  });

  it("does not repeat 모습 when partner behavior already describes a 모습", () => {
    const story = generateMockPreview({
      ...input,
      protagonistAlias: "기림",
      partnerAlias: "예림",
      partnerBehavior: "귀여운 웃는 모습"
    });
    const combined = [
      story.chapters[0].body,
      ...story.scenes.map((scene) => scene.body)
    ].join("\n");

    expect(combined).not.toContain("모습 모습을 보였다");
    expect(combined).toContain("예림은 늘 귀여운 웃는 모습을 보였다");
  });

  it("creates a premium-length free first episode", () => {
    const story = generateMockPreview(input);
    const freeEpisodeText = `${story.chapters[0].body}\n${story.chapters[0].ending_hook}`;

    expect(textLength(freeEpisodeText)).toBeGreaterThanOrEqual(
      LONG_FORM_TARGETS.freePreview.minChars
    );
  });

  it("adds a first-episode choice that creates a reason to stop", () => {
    const story = generateMockPreview(input);

    expect(story.chapters[0].next_choices).toHaveLength(3);
    expect(story.chapters[0].next_choices?.map((choice) => choice.label)).toEqual(
      story.next_choices.map((choice) => choice.label)
    );
  });

  it("creates an English preview when requested", () => {
    const story = generateMockPreview({
      ...input,
      outputLanguage: "en",
      breakupMoment: "the night it ended by text",
      breakupReason: "a misunderstanding between us",
      alternativeChoice: "I wish I had apologized first instead of getting angry.",
      lastScenePlace: "a rainy bus stop",
      rememberedDetail: "wet shoelaces and a glowing phone screen",
      partnerBehavior: "went silent before answering",
      protagonistAlias: "Harin",
      partnerAlias: "Yerim"
    });
    const combined = `${story.summary}\n${story.chapters[0].body}\n${story.chapters[0].ending_hook}`;

    expect(story.next_choices[0].label).toBe(
      "Find the real reason behind the read message"
    );
    expect(combined).toContain("[Yerim is typing...]");
    expect(combined).toContain("safe fictional");
  });

  it("opens the free episode with regret and unfinished longing", () => {
    const story = generateMockPreview(input);
    const combined = `${story.summary}\n${story.chapters[0].body}\n${story.chapters[0].ending_hook}`;

    expect(combined).toContain("그때 딱 한 문장만 다르게 말했더라면");
    expect(combined).toContain("아직 마음속에서 끝나지 않은 장면");
    expect(combined).toContain("읽음");
    expect(combined).toContain("[그 사람 님이 메시지를 입력 중입니다...]");
    expect(combined).toContain("어느 이야기의 방향");
  });

  it("does not include duplicate punctuation artifacts that break immersion", () => {
    const story = generateMockPreview(input);
    const combined = [
      story.summary,
      story.chapters[0].body,
      story.chapters[0].ending_hook,
      ...story.scenes.map((scene) => scene.body)
    ].join("\n");

    expect(combined).not.toContain(",,");
  });
});

describe("generateMockPaidChapters", () => {
  it("creates clearly different paid story arcs for each next choice", () => {
    const choices: NextChoice[] = [
      { choice_id: "A", label: "오해를 하나씩 풀어본다" },
      { choice_id: "B", label: "마지막 하루를 함께 보낸다" },
      { choice_id: "C", label: "각자의 진심을 편지로 남긴다" }
    ];

    const arcs = choices.map((choice) => generateMockPaidChapters(input, choice));
    const chapterTitles = arcs.map((chapters) =>
      chapters.map((chapter) => chapter.chapter_title).join(" / ")
    );
    const chapterBodies = arcs.map((chapters) =>
      chapters.map((chapter) => chapter.body).join("\n")
    );

    expect(new Set(chapterTitles).size).toBe(3);
    expect(chapterBodies[0]).toContain("오해");
    expect(chapterBodies[0]).toContain("사실");
    expect(chapterBodies[1]).toContain("마지막 하루");
    expect(chapterBodies[1]).toContain("같이");
    expect(chapterBodies[2]).toContain("편지");
    expect(chapterBodies[2]).toContain("봉투");
  });

  it("does not append extra particles after subject-marked aliases", () => {
    const chapters = generateMockPaidChapters(
      {
        ...input,
        protagonistAlias: "기림",
        partnerAlias: "예림",
        partnerBehavior: "귀를 자주 만졌어"
      },
      { choice_id: "A", label: "오해를 하나씩 풀어본다" }
    );
    const combined = chapters.map((chapter) => chapter.body).join("\n");

    expect(combined).not.toContain("예림은도");
    expect(combined).toContain(
      "기림은 먼저 자기 몫의 오해를 인정했고, 예림은 침묵으로 상대를 혼자 두었던 시간을 인정했다."
    );
  });

  it("avoids cold mechanical wording in emotional closing chapters", () => {
    const chapters = generateMockPaidChapters(
      input,
      { choice_id: "A", label: "오해를 하나씩 풀어본다" }
    );
    const combined = chapters.map((chapter) => chapter.body).join("\n");

    expect(combined).not.toContain("기계");
    expect(combined).toContain("과거를 다시 쓰는 방법이 아니라는 것을 알았다");
  });

  it("creates paid chapters long enough for a mobile web novel product", () => {
    const preview = generateMockPreview(input);
    const paidChapters = generateMockPaidChapters(
      input,
      { choice_id: "A", label: "오해를 하나씩 풀어본다" }
    );
    const fullText = [...preview.chapters, ...paidChapters]
      .map((chapter) => `${chapter.body}\n${chapter.ending_hook}`)
      .join("\n");

    expect(textLength(fullText)).toBeGreaterThanOrEqual(
      LONG_FORM_TARGETS.fullStory.minChars
    );
    expect(textLength(fullText)).toBeLessThanOrEqual(
      LONG_FORM_TARGETS.fullStory.maxChars
    );
    for (const chapter of paidChapters) {
      expect(textLength(`${chapter.body}\n${chapter.ending_hook}`)).toBeLessThanOrEqual(
        LONG_FORM_TARGETS.paidChapter.maxChars
      );
    }
  });

  it("pays off the selected regret immediately in chapter two", () => {
    const chapters = generateMockPaidChapters(
      input,
      { choice_id: "A", label: "내가 오해했던 장면을 다시 본다" }
    );
    const chapterTwoOpening = paragraphs(chapters[0].body).slice(0, 2).join("\n");

    expect(chapterTwoOpening).toContain("내가 오해한 건 상대가 아니라, 내 상처였다");
    expect(chapterTwoOpening).toContain("보내다 만 문장");
    expect(chapters[0].ending_hook).toContain(
      "기다린 건 답장이 아니라, 내가 틀리지 않았다는 증거였다"
    );
  });

  it("adds different next-episode choices to chapters 2 through 4", () => {
    const chapters = generateMockPaidChapters(
      input,
      { choice_id: "A", label: "오해를 하나씩 풀어본다" }
    );

    for (const chapter of chapters.slice(0, 3)) {
      expect(chapter.next_choices).toHaveLength(3);
    }
    expect(chapters[3].next_choices ?? []).toHaveLength(0);

    const choiceSets = chapters
      .slice(0, 3)
      .map((chapter) => chapter.next_choices?.map((choice) => choice.label).join(" / "));

    expect(new Set(choiceSets).size).toBe(3);
  });

  it("does not pad long chapters by repeating the same paragraphs", () => {
    const chapters = generateMockPaidChapters(
      input,
      { choice_id: "A", label: "오해를 하나씩 풀어본다" }
    );

    for (const chapter of chapters) {
      const chapterParagraphs = paragraphs(chapter.body);
      const repeatedParagraphs = chapterParagraphs.filter(
        (paragraph, index) => chapterParagraphs.indexOf(paragraph) !== index
      );

      expect(repeatedParagraphs).toHaveLength(0);
    }
  });

  it("varies paragraph openings so long chapters do not feel copy-pasted", () => {
    const chapters = generateMockPaidChapters(
      input,
      { choice_id: "A", label: "오해를 하나씩 풀어본다" }
    );

    for (const chapter of chapters) {
      const openings = paragraphs(chapter.body).map((paragraph) =>
        paragraph.slice(0, 36)
      );

      expect(new Set(openings).size / openings.length).toBeGreaterThan(0.85);
    }
  });

  it("does not leak structural branch counters into reader-facing prose", () => {
    const preview = generateMockPreview(input);
    const paidChapters = generateMockPaidChapters(
      input,
      { choice_id: "A", label: "오해를 하나씩 풀어본다" }
    );
    const combined = [...preview.chapters, ...paidChapters]
      .map((chapter) => chapter.body)
      .join("\n");

    expect(combined).not.toMatch(/\d+번째\s*갈림길/);
    expect(combined).not.toMatch(/\d+번째로\s*돌아온\s*정적/);
  });
});
