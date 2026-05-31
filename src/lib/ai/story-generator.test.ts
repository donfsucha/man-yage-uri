import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { generateMockPreview } from "@/lib/story/mock-generator";
import type { StoryInput } from "@/lib/story/schema";
import {
  assertGeneratedPreviewQuality,
  parseOpenAiJson,
  toStoryGenerationError
} from "./story-generator";

const input: StoryInput = {
  breakupMoment: "마지막 통화",
  breakupReason: "서로의 오해",
  alternativeChoice: "그때 미안하다는 말을 먼저 꺼내고 상대의 말을 끝까지 들었어야 했다.",
  lastScenePlace: "비 오는 정류장",
  rememberedDetail: "젖은 소매와 식어가던 커피",
  partnerBehavior: "귀여운 웃는 모습",
  emotion: "regret",
  desiredEnding: "growth",
  protagonistAlias: "하린",
  partnerAlias: "예림",
  agreedToFictionNotice: true,
  agreedToPrivacyNotice: true
};

describe("story generator prompts", () => {
  it("asks paid generation to deliver regret payoff without bloated length", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "lib", "ai", "story-generator.ts"),
      "utf8"
    );

    expect(source).toContain("The core emotion is regret and lingering longing");
    expect(source).toContain("must not end with calm self-acceptance");
    expect(source).toContain("strongest default safe cliffhanger");
    expect(source).toContain("old message suddenly marked as read");
    expect(source).toContain("visible typing indicator");
    expect(source).toContain("[예림 님이 메시지를 입력 중입니다...]");
    expect(source).toContain("[예림 님이 메시지를 입력 중입니다...]");
    expect(source).toContain("Write the generated story in natural English");
    expect(source).toContain("[Yerim is typing...]");
    expect(source).toContain("force the protagonist to choose a story direction");
    expect(source).toContain("cinematic and behavioral");
    expect(source).toContain("the protagonist's frozen finger must choose one direction");
    expect(source).toContain("make the paid branch feel necessary");
    expect(source).toContain("short sharp dialogue flashback");
    expect(source).toContain("specific unresolved clue");
    expect(source).toContain("Pay off the chapter 1 cliffhanger immediately in chapter 2");
    expect(source).toContain("read receipt or typing indicator");
    expect(source).toContain("selected branch feel consequential");
    expect(source).toContain("Chapter 2 must pay off the selected regret in the first scene");
    expect(source).toContain("Make the paid story feel cinematic");
    expect(source).toContain("The reader should feel the purchase was worth it by the end of chapter 2");
    expect(source).toContain("one quotable sentence per paid chapter");
    expect(source).toContain("viral-feeling scene");
    expect(source).toContain("about 50 mobile pages");
    expect(source).toContain("Avoid flat repetition");
    expect(source).toContain("A motif may return at most twice in chapter 1");
    expect(source).toContain("concrete past micro-episodes");
    expect(source).toContain("Every two paragraphs must introduce a new concrete action");
    expect(source).toContain("Do not repeat the same emotional image as filler");
    expect(source).toContain("Do not exceed 6,500 characters per paid chapter");
    expect(source).toContain("zodTextFormat");
    expect(source).toContain("preview_story");
    expect(source).toContain("paid_story_chapters");
    expect(source).toContain("body_paragraphs");
    expect(source).toContain("z.array(z.string().min(300).max(480)).length(9)");
    expect(source).toContain("body: z.string().min(80).max(180)");
    expect(source).toContain("PREVIEW_MAX_OUTPUT_TOKENS = 12000");
    expect(source).toContain("max_output_tokens: 22000");
  });

  it("maps truncated preview JSON to a retryable OpenAI preview error", () => {
    expect(() => parseOpenAiJson('{"title":"unfinished"', "preview")).toThrow(
      "OpenAI preview response was invalid JSON or truncated."
    );
  });

  it("maps OpenAI quota failures to a customer-safe message", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = toStoryGenerationError(
      new Error(
        "429 You exceeded your current quota, please check your plan and billing details."
      )
    );

    expect(error.message).toBe(
      "스토리 생성량이 일시적으로 한도에 도달했습니다. 잠시 후 다시 시도해 주세요."
    );
    consoleError.mockRestore();
  });

  it("rejects whitespace-padded preview drafts", () => {
    const story = generateMockPreview(input);

    story.chapters[0].body = `짧은 문장\n\n${" ".repeat(5000)}`;

    expect(() => assertGeneratedPreviewQuality(story)).toThrow(
      "OpenAI preview response was too short."
    );
  });

  it("rejects meta copy that explains the generated length", () => {
    const story = generateMockPreview(input);

    story.chapters[0].body = `${story.chapters[0].body}\n\n(총 5,123자)`;

    expect(() => assertGeneratedPreviewQuality(story)).toThrow(
      "OpenAI preview response contained meta copy."
    );
  });

  it("rejects structured JSON leakage inside generated prose", () => {
    const story = generateMockPreview(input);

    story.chapters[0].body = `${story.chapters[0].body}\n\n],'next_choices':[{'choice_id':'A','label':'다음 선택'}],'safety_flags':{'contains_self_harm_risk':false}`;

    expect(() => assertGeneratedPreviewQuality(story)).toThrow(
      "OpenAI preview response contained structured data leakage."
    );
  });
});
