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
  body_paragraphs: z.array(z.string().min(420).max(650)).length(12),
  ending_hook: z.string().min(10),
  next_choices: z.array(NextChoiceSchema).length(3)
});

const PreviewSceneResponseSchema = PreviewStorySchema.shape.scenes.element.extend({
  body: z.string().min(450).max(700)
});

const PreviewStoryResponseSchema = z.object({
  title: PreviewStorySchema.shape.title,
  genre: PreviewStorySchema.shape.genre,
  emotional_tone: PreviewStorySchema.shape.emotional_tone,
  summary: PreviewStorySchema.shape.summary,
  chapters: z.array(PreviewChapterResponseSchema).length(1),
  scenes: z.array(PreviewSceneResponseSchema).length(5),
  next_choices: z.array(NextChoiceSchema).length(3),
  safety_flags: PreviewStorySchema.shape.safety_flags
});

const PaidChapterResponseSchema = PreviewStorySchema.shape.chapters.element.extend({
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

function previewPrompt(input: StoryInput) {
  return [
    "You write Korean web novel fiction for emotional reflection after a breakup.",
    "Never predict a real person's mind or future.",
    "Never encourage contacting, stalking, threatening, or manipulating an ex-partner.",
    "Return JSON only. No markdown.",
    "The core emotion is regret and lingering longing: 'if I had said one sentence differently' should drive the free episode.",
    "The JSON keys must be: title, genre, emotional_tone, summary, chapters, scenes, next_choices, safety_flags.",
    "chapters must contain chapter 1 only. next_choices must contain A, B, C.",
    "Chapter 1 must use body_paragraphs instead of body: exactly 12 Korean prose paragraphs, each 420 to 650 Korean characters.",
    "Chapter 1 must also include next_choices with the same three A/B/C options so the reader stops and chooses after episode 1.",
    "This is a paid-product preview, not a short summary.",
    "Chapter 1 body must be 4,000 to 6,500 Korean characters and feel like 8 to 12 mobile pages.",
    "The length must come from real prose only; never use blank-line padding, counters, '(total characters)', participation instructions, or meta explanations.",
    "Chapter 1 must make the reader feel this is their unfinished scene, not generic breakup advice.",
    "scenes must contain exactly 5 concrete scene cards.",
    "Each scene body must be 450 to 700 Korean characters with place, sensory detail, behavior, tension, and a safe emotional turn.",
    "Each scene must have scene_no, scene_title, setting, body, dialogue, visual_prompt, emotion.",
    "Use a scene rhythm: place -> small behavior -> misunderstanding/tension -> different response -> unanswered hook.",
    "Use lastScenePlace, rememberedDetail, and partnerBehavior as sensory anchors so the story feels specific.",
    "If rememberedDetail is an adjective-like fragment such as '웃는 보조개가 예뻐', rewrite it naturally with the partner alias, e.g. '웃는 보조개가 예쁜 예림이', before adding particles.",
    "Do not describe the ex-partner's real inner thoughts as fact; keep it framed as fiction and the protagonist's reflection.",
    `Input: ${JSON.stringify(input)}`
  ].join("\n");
}

function paidPrompt(input: StoryInput, selectedChoice: NextChoice) {
  return [
    "Continue the Korean breakup-reflection web novel as fiction.",
    "Generate paid chapters 2 through 5 only.",
    "Return JSON only with one key: chapters.",
    "Each chapter must have chapter_no, chapter_title, body, ending_hook.",
    "Chapters 2, 3, and 4 must also include next_choices with three A/B/C options for the next episode.",
    "Chapter 5 is the ending and must not include next_choices.",
    "Each chapter body must be 10,000 to 13,000 Korean characters.",
    "The full 5-episode story should feel like 80 to 100 mobile pages, not a short outline.",
    "Each paid chapter must contain 4 to 5 immersive scenes with concrete place, object, gesture, dialogue, tension, and a chapter-end hook.",
    "Carry forward the concrete place, sensory detail, and behavior cues from the input.",
    "The selectedChoice must strongly change chapters 2 through 5, not just the first sentence.",
    "Chapter 2 must pay off the selected regret in the first scene so the paid story feels worth the purchase immediately.",
    "If selectedChoice is A, focus on resolving misunderstandings and concrete facts.",
    "If selectedChoice is B, focus on one final shared day with ordinary scene details.",
    "If selectedChoice is C, focus on unsent letters, envelopes, and self-directed closure.",
    "Do not reuse the same plot structure across different choices.",
    "Do not exceed 13,000 Korean characters per paid chapter.",
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
        const story = await requestPreviewStory(input);

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

async function requestPreviewStory(input: StoryInput): Promise<PreviewStory> {
  const config = getRuntimeConfig();
  const response = await openAiClient().responses.create({
    model: config.openAiStoryModel,
    input: previewPrompt(input),
    max_output_tokens: 10000,
    text: {
      format: zodTextFormat(PreviewStoryResponseSchema, "preview_story")
    }
  });
  const responseStory = PreviewStoryResponseSchema.parse(JSON.parse(response.output_text));
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
      max_output_tokens: 30000,
      text: {
        format: zodTextFormat(
          PaidStoryChaptersResponseSchema,
          "paid_story_chapters"
        )
      }
    });
    const responseStory = PaidStoryChaptersResponseSchema.parse(
      JSON.parse(response.output_text)
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
