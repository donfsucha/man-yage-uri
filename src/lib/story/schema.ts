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
  breakupMoment: z.string().min(2).max(80),
  breakupReason: z.string().min(2).max(80),
  alternativeChoice: z.string().min(5).max(600),
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

export const ChapterSchema = z.object({
  chapter_no: z.number().int().positive(),
  chapter_title: z.string().min(1),
  body: z.string().min(80),
  ending_hook: z.string().min(10)
});

export const NextChoiceSchema = z.object({
  choice_id: z.enum(["A", "B", "C"]),
  label: z.string().min(4).max(80)
});

export const ChoiceIdSchema = NextChoiceSchema.shape.choice_id;

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

export const PreviewStorySchema = z
  .object({
    title: z.string().min(2).max(80),
    genre: z.string().min(2).max(40),
    emotional_tone: z.string().min(2).max(80),
    summary: z.string().min(20).max(500),
    chapters: z.array(ChapterSchema).length(1),
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
export type NextChoice = z.infer<typeof NextChoiceSchema>;
export type ChoiceId = z.infer<typeof ChoiceIdSchema>;
export type SafetyFlags = z.infer<typeof SafetyFlagsSchema>;
export type StoryStatus = z.infer<typeof StoryStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

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
