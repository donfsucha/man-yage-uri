import { z } from "zod";

export const EmotionSchema = z.enum([
  "regret",
  "longing",
  "anger",
  "calm",
  "gratitude"
]);

export const DesiredEndingSchema = z.enum([
  "reunion",
  "growth",
  "farewell",
  "parallel_world"
]);

export const StoryInputSchema = z.object({
  outputLanguage: z.enum(["ko", "en"]).optional(),
  breakupMoment: z.string().min(2).max(80),
  breakupReason: z.string().min(2).max(80),
  alternativeChoice: z.string().min(5).max(600),
  lastScenePlace: z.string().min(2).max(80),
  rememberedDetail: z.string().min(2).max(160),
  partnerBehavior: z.string().min(2).max(160),
  emotion: EmotionSchema,
  desiredEnding: DesiredEndingSchema,
  protagonistAlias: z.string().min(1).max(24),
  partnerAlias: z.string().min(1).max(24),
  agreedToFictionNotice: z.literal(true),
  agreedToPrivacyNotice: z.literal(true)
});

export const SafetyFlagsSchema = z.object({
  contains_self_harm_risk: z.boolean(),
  contains_stalking_risk: z.boolean(),
  requires_manual_review: z.boolean()
});

export const NextChoiceSchema = z.object({
  choice_id: z.enum(["A", "B", "C"]),
  label: z.string().min(4).max(80)
});

export const ChoiceIdSchema = NextChoiceSchema.shape.choice_id;

export const ChapterSchema = z.object({
  chapter_no: z.number().int().positive(),
  chapter_title: z.string().min(1),
  body: z.string().min(80),
  ending_hook: z.string().min(10),
  next_choices: z.array(NextChoiceSchema).length(3).optional()
});

export const StorySceneSchema = z.object({
  scene_no: z.number().int().positive(),
  scene_title: z.string().min(2).max(80),
  setting: z.string().min(2).max(120),
  body: z.string().min(40).max(700),
  dialogue: z.string().min(2).max(160),
  visual_prompt: z.string().min(20).max(500),
  emotion: z.string().min(2).max(80)
});

export const StoryStatusSchema = z.enum([
  "draft",
  "preview_ready",
  "choice_selected",
  "payment_pending",
  "paid",
  "completed",
  "blocked",
  "generation_failed"
]);

export const PaymentStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "canceled",
  "refunded"
]);

export const AnalyticsEventNameSchema = z.enum([
  "create_page_view",
  "landing_view",
  "story_start",
  "story_validation_error",
  "preview_generated",
  "preview_failed",
  "choice_selected",
  "checkout_view",
  "checkout_click",
  "payment_started",
  "payment_success",
  "payment_failed",
  "payment_canceled",
  "story_completed_view",
  "bonus_download",
  "language_changed"
]);

export const PreviewStorySchema = z
  .object({
    title: z.string().min(2).max(80),
    genre: z.string().min(2).max(40),
    emotional_tone: z.string().min(2).max(80),
    summary: z.string().min(20).max(500),
    chapters: z.array(ChapterSchema).length(1),
    scenes: z.array(StorySceneSchema).min(3).max(5),
    next_choices: z.array(NextChoiceSchema).length(3),
    safety_flags: SafetyFlagsSchema
  })
  .refine((story) => story.chapters[0]?.chapter_no === 1, {
    message: "Preview generation must contain chapter 1 only.",
    path: ["chapters"]
  });

export type StoryInput = z.infer<typeof StoryInputSchema>;
export type PreviewStory = z.infer<typeof PreviewStorySchema>;
export type StoryChapter = z.infer<typeof ChapterSchema>;
export type StoryScene = z.infer<typeof StorySceneSchema>;
export type NextChoice = z.infer<typeof NextChoiceSchema>;
export type ChoiceId = z.infer<typeof ChoiceIdSchema>;
export type SafetyFlags = z.infer<typeof SafetyFlagsSchema>;
export type StoryStatus = z.infer<typeof StoryStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type AnalyticsEventName = z.infer<typeof AnalyticsEventNameSchema>;

export type MockPayment = {
  productType: "five_episode_complete";
  amount: number;
  orderId: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

export type StoredPreviewStory = {
  id: string;
  input: StoryInput;
  story: PreviewStory;
  status: StoryStatus;
  selectedChoiceId: ChoiceId | null;
  payment: MockPayment | null;
  createdAt: string;
  updatedAt: string;
};

export type StoryEvent = {
  id: string;
  eventName: AnalyticsEventName;
  storyId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};
