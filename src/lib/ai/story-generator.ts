import OpenAI from "openai";
import { getRuntimeConfig } from "@/lib/config/runtime";
import {
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

function openAiClient() {
  const config = getRuntimeConfig();

  if (!config.openAiApiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  return new OpenAI({ apiKey: config.openAiApiKey });
}

function previewPrompt(input: StoryInput) {
  return [
    "You write Korean web novel fiction for emotional reflection after a breakup.",
    "Never predict a real person's mind or future.",
    "Never encourage contacting, stalking, threatening, or manipulating an ex-partner.",
    "Return JSON only. No markdown.",
    "The JSON keys must be: title, genre, emotional_tone, summary, chapters, next_choices, safety_flags.",
    "chapters must contain chapter 1 only. next_choices must contain A, B, C.",
    `Input: ${JSON.stringify(input)}`
  ].join("\n");
}

function paidPrompt(input: StoryInput, selectedChoice: NextChoice) {
  return [
    "Continue the Korean breakup-reflection web novel as fiction.",
    "Generate paid chapters 2 through 5 only.",
    "Return JSON only with one key: chapters.",
    "Each chapter must have chapter_no, chapter_title, body, ending_hook.",
    "Keep the story emotionally safe and avoid real-person prediction or contact encouragement.",
    `Input: ${JSON.stringify({ input, selectedChoice })}`
  ].join("\n");
}

export async function generatePreviewStory(input: StoryInput): Promise<PreviewStory> {
  const config = getRuntimeConfig();

  if (config.mockOpenAI) {
    return generateMockPreview(input);
  }

  const response = await openAiClient().responses.create({
    model: config.openAiStoryModel,
    input: previewPrompt(input)
  });
  const parsed = PreviewStorySchema.safeParse(JSON.parse(response.output_text));

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

  const response = await openAiClient().responses.create({
    model: config.openAiStoryModel,
    input: paidPrompt(input, selectedChoice)
  });
  const parsed = JSON.parse(response.output_text) as { chapters?: unknown };
  const chapters = PreviewStorySchema.shape.chapters.element
    .array()
    .length(4)
    .parse(parsed.chapters);

  return chapters;
}
