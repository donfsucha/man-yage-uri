import { z } from "zod";

export const productStatusSchema = z.enum([
  "play_store_update_pending",
  "launch_preparing",
  "officially_launched"
]);

export const audienceSchema = z.enum([
  "seniors_parents",
  "church_teams",
  "ordinary_believers",
  "gift_buyers"
]);

export const purposeSchema = z.enum([
  "launch_notice",
  "product_explainer",
  "usage_guide",
  "church_adoption",
  "parent_empathy"
]);

export const videoLengthSchema = z.enum(["15s", "30s", "45s"]);

export const toneSchema = z.enum([
  "warm",
  "trustworthy",
  "simple_friendly",
  "church_proposal"
]);

export const shortsMakerInputSchema = z.object({
  productStatus: productStatusSchema,
  audience: audienceSchema,
  purpose: purposeSchema,
  length: videoLengthSchema,
  tone: toneSchema,
  memo: z.string().trim().max(600).optional()
});

export const storyboardSceneSchema = z.object({
  scene: z.string().min(1),
  visual: z.string().min(1),
  narration: z.string().min(1),
  onScreenText: z.string().min(1)
});

export const shortsPackageSchema = z.object({
  hooks: z.array(z.string().min(1)).min(3),
  script: z.string().min(1),
  subtitles: z.array(z.string().min(1)).min(1),
  storyboard: z.array(storyboardSceneSchema).min(1),
  shotList: z.array(z.string().min(1)).min(1),
  titleOptions: z.array(z.string().min(1)).min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).min(1),
  ctaOptions: z.array(z.string().min(1)).min(1),
  thumbnailTextOptions: z.array(z.string().min(1)).min(1),
  reviewChecklist: z.array(z.string().min(1)).min(1)
});

export type ProductStatus = z.infer<typeof productStatusSchema>;
export type Audience = z.infer<typeof audienceSchema>;
export type Purpose = z.infer<typeof purposeSchema>;
export type VideoLength = z.infer<typeof videoLengthSchema>;
export type Tone = z.infer<typeof toneSchema>;
export type ShortsMakerInput = z.infer<typeof shortsMakerInputSchema>;
export type ShortsPackage = z.infer<typeof shortsPackageSchema>;
