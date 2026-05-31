import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config/runtime";
import {
  NextChoiceSchema,
  PreviewStorySchema,
  type NextChoice,
  type PreviewStory,
  type StoryChapter,
  type StoryInput
} from "@/lib/story/schema";
import {
  generateMockPaidChapters,
  generateMockPreview
} from "@/lib/story/mock-generator";
import { countReadableChars, LONG_FORM_TARGETS } from "@/lib/story/story-length";

const PreviewChapterResponseSchema = z.object({
  chapter_no: z.number().int().positive(),
  chapter_title: z.string().min(1),
  body_paragraphs: z.array(z.string().min(300).max(480)).length(9),
  ending_hook: z.string().min(10),
  next_choices: z.array(NextChoiceSchema).length(3)
});

const PreviewSceneResponseSchema = PreviewStorySchema.shape.scenes.element.extend({
  body: z.string().min(80).max(180)
});

const PreviewStoryResponseSchema = z.object({
  title: PreviewStorySchema.shape.title,
  genre: PreviewStorySchema.shape.genre,
  emotional_tone: PreviewStorySchema.shape.emotional_tone,
  summary: PreviewStorySchema.shape.summary,
  chapters: z.array(PreviewChapterResponseSchema).length(1),
  scenes: z.array(PreviewSceneResponseSchema).length(3),
  next_choices: z.array(NextChoiceSchema).length(3),
  safety_flags: PreviewStorySchema.shape.safety_flags
});

const PaidChapterResponseSchema = PreviewStorySchema.shape.chapters.element.extend({
  body: z
    .string()
    .min(LONG_FORM_TARGETS.paidChapter.minChars)
    .max(LONG_FORM_TARGETS.paidChapter.maxChars),
  next_choices: z.array(NextChoiceSchema).length(3).nullable()
});

const PaidStoryChaptersResponseSchema = z.object({
  chapters: z.array(PaidChapterResponseSchema).length(4)
});

const PaidStoryChaptersSchema = z.object({
  chapters: PreviewStorySchema.shape.chapters.element.array().length(4)
});

const generatedMetaCopyPattern =
  /(총\s*[\d,]+\s*자|모바일\s*페이지|참여해 주세요|다음에 어떤 선택|이 이야기는 아직 당신의 손|분량을\s*맞)/;
const generatedStructureLeakPattern =
  /(['"]?\s*(safety_flags|next_choices|scene_no|scene_title|visual_prompt|choice_id|chapter_no|chapter_title|body_paragraphs)\s*['"]?\s*:|\]{2,}|\}{2,})/;
const PREVIEW_MAX_OUTPUT_TOKENS = 12000;

function openAiClient() {
  const config = getRuntimeConfig();

  if (!config.openAiApiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  return new OpenAI({ apiKey: config.openAiApiKey });
}

export function toStoryGenerationError(error: unknown) {
  console.error("Story generation failed", error);

  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("429") ||
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("rate limit")
  ) {
    return new Error(
      "스토리 생성량이 일시적으로 한도에 도달했습니다. 잠시 후 다시 시도해 주세요."
    );
  }

  if (
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("authentication")
  ) {
    return new Error(
      "스토리 생성 API 설정을 확인해야 합니다. 잠시 후 다시 시도해 주세요."
    );
  }

  return new Error("스토리 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
}

export function assertGeneratedPreviewQuality(story: PreviewStory) {
  const chapter = story.chapters[0];
  const chapterChars = countReadableChars(`${chapter.body}\n${chapter.ending_hook}`);
  const combined = [
    story.summary,
    chapter.body,
    chapter.ending_hook,
    ...story.scenes.flatMap((scene) => [scene.body, scene.dialogue])
  ].join("\n");

  if (chapterChars < LONG_FORM_TARGETS.freePreview.minChars) {
    throw new Error("OpenAI preview response was too short.");
  }

  if (generatedMetaCopyPattern.test(combined)) {
    throw new Error("OpenAI preview response contained meta copy.");
  }

  if (generatedStructureLeakPattern.test(combined)) {
    throw new Error("OpenAI preview response contained structured data leakage.");
  }
}

export function parseOpenAiJson(outputText: string, label: string) {
  try {
    return JSON.parse(outputText);
  } catch {
    throw new Error(
      `OpenAI ${label} response was invalid JSON or truncated.`
    );
  }
}

function storyLanguage(input: StoryInput) {
  return input.outputLanguage === "en" ? "en" : "ko";
}

function previewPrompt(input: StoryInput, attempt = 0) {
  const language = storyLanguage(input);
  const languageInstructions =
    language === "en"
      ? [
          "Write the generated story in natural English for an international reader.",
          "Keep user-provided aliases exactly as written, but translate all narration, choices, chapter titles, scene cards, and payment hooks into English.",
          "Use an English typing-indicator style in the ending hook, e.g. '[Yerim is typing...]'."
        ]
      : [
          "Write the generated story in natural Korean.",
          "Use a Korean typing-indicator style in the ending hook, e.g. '[예림 님이 메시지를 입력 중입니다...]'."
        ];
  const retryInstructions =
    attempt > 0
      ? [
          "This is a retry because the previous response was invalid or leaked JSON structure into prose.",
          "Inside prose fields, never write JSON keys, brackets, schema names, counters, or object-like fragments.",
          "Keep all schema keys only as JSON property names. Prose must be ordinary Korean sentences only."
        ]
      : [];

  return [
    "You write web novel fiction for emotional reflection after a breakup.",
    ...languageInstructions,
    "Never predict a real person's mind or future.",
    "Never encourage contacting, stalking, threatening, or manipulating an ex-partner.",
    "Return JSON only. No markdown.",
    ...retryInstructions,
    "The core emotion is regret and lingering longing: 'if I had said one sentence differently' should drive the free episode.",
    "The JSON keys must be: title, genre, emotional_tone, summary, chapters, scenes, next_choices, safety_flags.",
    "chapters must contain chapter 1 only. next_choices must contain A, B, C.",
    "Chapter 1 must use body_paragraphs instead of body: exactly 9 prose paragraphs, each 300 to 480 characters in the selected output language.",
    "Chapter 1 must also include next_choices with the same three A/B/C options so the reader stops and chooses after episode 1.",
    "This is a paid-product preview, not a short summary.",
    "Chapter 1 body must be 2,800 to 4,200 characters in the selected output language and feel like 5 to 8 mobile pages.",
    "The length must come from real prose only; never use blank-line padding, counters, '(total characters)', participation instructions, or meta explanations.",
    "Chapter 1 must make the reader feel this is their unfinished scene, not generic breakup advice.",
    "Chapter 1 must not end with calm self-acceptance or a completed lesson. It must end with a concrete external event that reopens the problem.",
    "Use the strongest default safe cliffhanger: an old message suddenly marked as read, followed by a visible typing indicator using the partner alias.",
    "The final ending_hook should move visually from the read receipt to the typing indicator, then force the protagonist to choose a story direction without encouraging real-world contact.",
    "You may use a failed-send draft, delayed voice memo, calendar reminder, receipt timestamp, or returning object only as secondary support for the read-and-typing cliffhanger.",
    "The cliffhanger must make the reader ask what really happened next, but it must not encourage real-world contact, stalking, visiting, threatening, or manipulating anyone.",
    "Before the cliffhanger, include one short sharp dialogue flashback from the tired relationship, no more than four lines, so the conflict is shown instead of explained.",
    "The ending_hook must contain a specific unresolved clue and a question of consequence, not a vague emotional sentence.",
    "The three next_choices must feel like paid branches with stakes: misunderstanding/fact, final day/truth, silence/letter. Each label should imply a different risk or revelation.",
    "Avoid flat repetition: do not restate the same smile, coffee, anger, silence, leaving, or physical detail as the same emotional beat.",
    "A motif may return at most twice in chapter 1, and every return must reveal new information, change meaning, or move the scene forward.",
    "Add one or two concrete past micro-episodes that show why the relationship became tired: a postponed promise, missed routine, small disappointment, unread message, or ordinary day that changed tone.",
    "If rememberedDetail or partnerBehavior appears more than once, vary the verb, situation, and consequence; never copy the same description with only small wording changes.",
    "Every two paragraphs must introduce a new concrete action, memory, object, decision, or tension turn.",
    "scenes must contain exactly 3 concrete scene cards.",
    "Each scene body must be 80 to 180 Korean characters with place, sensory detail, behavior, tension, and a safe emotional turn.",
    "Each scene must have scene_no, scene_title, setting, body, dialogue, visual_prompt, emotion.",
    "Use a scene rhythm: place -> small behavior -> misunderstanding/tension -> different response -> unanswered hook.",
    "Use lastScenePlace, rememberedDetail, and partnerBehavior as sensory anchors so the story feels specific.",
    "If rememberedDetail is an adjective-like fragment such as '웃는 보조개가 예뻐', rewrite it naturally with the partner alias, e.g. '웃는 보조개가 예쁜 예림이', before adding particles.",
    "Do not describe the ex-partner's real inner thoughts as fact; keep it framed as fiction and the protagonist's reflection.",
    `Input: ${JSON.stringify(input)}`
  ].join("\n");
}

function paidPrompt(input: StoryInput, selectedChoice: NextChoice) {
  const language = storyLanguage(input);
  const languageInstructions =
    language === "en"
      ? [
          "Write the paid chapters in natural English for an international reader.",
          "Keep the same fictional facts and aliases, but translate chapter titles, choices, hooks, and narration into English.",
          "If the free preview used a typing indicator, pay it off in English as a fictional clue rather than a real contact instruction."
        ]
      : [
          "Write the paid chapters in natural Korean.",
          "If the free preview used a typing indicator, pay it off in Korean as a fictional clue rather than a real contact instruction."
        ];

  return [
    "Continue the breakup-reflection web novel as fiction.",
    ...languageInstructions,
    "Generate paid chapters 2 through 5 only.",
    "Return JSON only with one key: chapters.",
    "Each chapter must have chapter_no, chapter_title, body, ending_hook.",
    "Chapters 2, 3, and 4 must also include next_choices with three A/B/C options for the next episode.",
    "Chapter 5 is the ending and must not include next_choices.",
    "Each paid chapter body must be 5,000 to 6,500 characters in the selected output language.",
    "The full 5-episode story should feel like about 50 mobile pages, ideally 45 to 55 pages, not a short outline and not an overlong novel.",
    "Each paid chapter must contain 3 to 4 immersive scenes with concrete place, object, gesture, dialogue, tension, and a chapter-end hook.",
    "Make the paid story feel cinematic: each chapter needs a vivid opening shot, a tactile object, one memorable line of dialogue, a midpoint reversal, and a clear emotional payoff.",
    "The reader should feel the purchase was worth it by the end of chapter 2: reveal one specific fact, missed signal, or visual memory that was not available in the free preview.",
    "Pay off the chapter 1 cliffhanger immediately in chapter 2. The first scene must answer one clue from the read receipt or typing indicator while opening a larger emotional question.",
    "Paid chapters must make the selected branch feel consequential: the same breakup must become a different story depending on the user's choice.",
    "Make it share-worthy without sounding like marketing: include one quotable sentence per paid chapter that a reader would want to screenshot because it names a feeling precisely.",
    "Build at least one viral-feeling scene: a quiet but surprising emotional reversal, a concrete object returning with new meaning, or a final line that reinterprets the breakup.",
    "Avoid cheap twists, forced reunions, exaggerated melodrama, and generic healing advice; the story should spread because it feels specific and painfully true.",
    "Use film-like scene transitions, but never use screenplay labels, camera directions, or meta commentary.",
    "The ending must feel earned and complete, with a final image the reader can remember after closing the page.",
    "Carry forward the concrete place, sensory detail, and behavior cues from the input.",
    "Do not repeat the same emotional image as filler. If a prop, gesture, or line returns, it must gain a new story function.",
    "Include concrete past micro-episodes that explain the breakup pressure instead of only repeating regret, longing, or the same attractive detail.",
    "Balance emotional amplification with narrative variety: each chapter needs at least one new incident from the relationship's past and one present-tense action that changes the protagonist's understanding.",
    "The selectedChoice must strongly change chapters 2 through 5, not just the first sentence.",
    "Chapter 2 must pay off the selected regret in the first scene so the paid story feels worth the purchase immediately.",
    "If selectedChoice is A, focus on resolving misunderstandings and concrete facts.",
    "If selectedChoice is B, focus on one final shared day with ordinary scene details.",
    "If selectedChoice is C, focus on unsent letters, envelopes, and self-directed closure.",
    "Do not reuse the same plot structure across different choices.",
    "Do not exceed 6,500 characters per paid chapter in the selected output language.",
    "Do not pad length by repeating the same paragraph. Every paragraph needs a new action, object, line of dialogue, memory detail, or tension turn.",
    "Do not use blank-line padding, counters, character-count notes, or meta explanations to satisfy length.",
    "Keep the story emotionally safe and avoid real-person prediction or contact encouragement.",
    `Input: ${JSON.stringify({ input, selectedChoice })}`
  ].join("\n");
}

export async function generatePreviewStory(input: StoryInput): Promise<PreviewStory> {
  const config = getRuntimeConfig();

  if (config.mockOpenAI) {
    return generateMockPreview(input);
  }

  try {
    let lastQualityError: unknown = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const story = await requestPreviewStory(input, attempt);

        assertGeneratedPreviewQuality(story);

        return story;
      } catch (error) {
        lastQualityError = error;

        if (!(error instanceof Error) || !error.message.startsWith("OpenAI preview response")) {
          throw error;
        }
      }
    }

    throw lastQualityError;
  } catch (error) {
    throw toStoryGenerationError(error);
  }
}

async function requestPreviewStory(
  input: StoryInput,
  attempt = 0
): Promise<PreviewStory> {
  const config = getRuntimeConfig();
  const response = await openAiClient().responses.create({
    model: config.openAiStoryModel,
    input: previewPrompt(input, attempt),
    max_output_tokens: PREVIEW_MAX_OUTPUT_TOKENS,
    text: {
      format: zodTextFormat(PreviewStoryResponseSchema, "preview_story")
    }
  });
  const responseStory = PreviewStoryResponseSchema.parse(
    parseOpenAiJson(response.output_text, "preview")
  );
  const parsed = PreviewStorySchema.safeParse({
    ...responseStory,
    chapters: responseStory.chapters.map((chapter) => {
      const { body_paragraphs: bodyParagraphs, ...rest } = chapter;

      return {
        ...rest,
        body: bodyParagraphs.join("\n\n")
      };
    })
  });

  if (!parsed.success) {
    throw new Error("OpenAI preview response did not match the story schema.");
  }

  return parsed.data;
}

export async function generatePaidStoryChapters(
  input: StoryInput,
  selectedChoice: NextChoice
): Promise<StoryChapter[]> {
  const config = getRuntimeConfig();

  if (config.mockOpenAI) {
    return generateMockPaidChapters(input, selectedChoice);
  }

  try {
    const response = await openAiClient().responses.create({
      model: config.openAiStoryModel,
      input: paidPrompt(input, selectedChoice),
      max_output_tokens: 22000,
      text: {
        format: zodTextFormat(
          PaidStoryChaptersResponseSchema,
          "paid_story_chapters"
        )
      }
    });
    const responseStory = PaidStoryChaptersResponseSchema.parse(
      parseOpenAiJson(response.output_text, "paid story")
    );
    const parsed = PaidStoryChaptersSchema.parse({
      chapters: responseStory.chapters.map((chapter) => ({
        ...chapter,
        ...(chapter.next_choices ? { next_choices: chapter.next_choices } : {})
      }))
    });

    return parsed.chapters;
  } catch (error) {
    throw toStoryGenerationError(error);
  }
}
