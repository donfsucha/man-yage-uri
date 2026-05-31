import { getRuntimeConfig } from "@/lib/config/runtime";
import {
  generatePaidStoryChapters,
  generatePreviewStory
} from "@/lib/ai/story-generator";
import {
  completeMockPayment,
  createMockPayment,
  deleteStory,
  getPreviewStory,
  listStoryEvents,
  listStories,
  recordStoryEvent,
  savePreviewStory,
  selectStoryChoice
} from "./store";
import {
  completePaymentInSupabase,
  createPaymentInSupabase,
  deleteStoryFromSupabase,
  listAnalyticsEventsFromSupabase,
  getStoryFromSupabase,
  listStoriesFromSupabase,
  recordAnalyticsEventToSupabase,
  savePreviewStoryToSupabase,
  selectStoryChoiceInSupabase
} from "./supabase-store";
import type { AnalyticsEventName, PreviewStory, StoryInput } from "./schema";

function shouldUseSupabase() {
  return !getRuntimeConfig().mockSupabase;
}

export async function createPreview(input: StoryInput) {
  const story = await generatePreviewStory(input);
  const stored = shouldUseSupabase()
    ? await savePreviewStoryToSupabase(input, story)
    : savePreviewStory(input, story);

  if (!stored) {
    throw new Error("Failed to save generated story.");
  }

  return stored;
}

export async function getStory(id: string) {
  return shouldUseSupabase() ? getStoryFromSupabase(id) : getPreviewStory(id);
}

export async function getStories() {
  return shouldUseSupabase() ? listStoriesFromSupabase() : listStories();
}

export async function chooseStoryDirection(
  storyId: string,
  choiceId: string,
  customChoiceText?: string
) {
  return shouldUseSupabase()
    ? selectStoryChoiceInSupabase(storyId, choiceId, customChoiceText)
    : selectStoryChoice(storyId, choiceId, customChoiceText);
}

export async function prepareMockPayment(storyId: string) {
  return shouldUseSupabase()
    ? createPaymentInSupabase(storyId)
    : createMockPayment(storyId);
}

export async function prepareExternalPayment(
  storyId: string,
  orderId: string,
  amount = 7900
) {
  return shouldUseSupabase()
    ? createPaymentInSupabase(storyId, amount, orderId)
    : createMockPayment(storyId, amount, orderId);
}

export async function completePreparedPaidStory(storyId: string, orderId?: string) {
  const existing = await getStory(storyId);

  if (
    existing?.status === "completed" &&
    existing.payment?.status === "paid" &&
    existing.story.chapters.length >= 5
  ) {
    return existing;
  }

  if (!existing || !existing.selectedChoiceId) {
    return null;
  }

  const selectedChoice = existing.story.next_choices.find(
    (choice) => choice.choice_id === existing.selectedChoiceId
  );

  if (!selectedChoice) {
    return null;
  }

  const paidChapters = await generatePaidStoryChapters(existing.input, selectedChoice);

  return shouldUseSupabase()
    ? completePaymentInSupabase(storyId, paidChapters, orderId)
    : completeMockPayment(storyId);
}

export async function completeMockPaidStory(storyId: string) {
  const existing = await getStory(storyId);

  if (
    existing?.status === "completed" &&
    existing.payment?.status === "paid" &&
    existing.story.chapters.length >= 5
  ) {
    return existing;
  }

  const paymentReady = await prepareMockPayment(storyId);

  if (!paymentReady || !paymentReady.selectedChoiceId) {
    return null;
  }

  const selectedChoice = paymentReady.story.next_choices.find(
    (choice) => choice.choice_id === paymentReady.selectedChoiceId
  );

  if (!selectedChoice) {
    return null;
  }

  return completePreparedPaidStory(storyId);
}

export async function removeStory(storyId: string) {
  return shouldUseSupabase() ? deleteStoryFromSupabase(storyId) : deleteStory(storyId);
}

export async function recordAnalyticsEvent({
  eventName,
  storyId = null,
  metadata = {}
}: {
  eventName: AnalyticsEventName;
  storyId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return shouldUseSupabase()
    ? recordAnalyticsEventToSupabase({ eventName, storyId, metadata })
    : recordStoryEvent({ eventName, storyId, metadata });
}

export async function getAnalyticsEvents(storyId?: string) {
  return shouldUseSupabase()
    ? listAnalyticsEventsFromSupabase(storyId)
    : listStoryEvents(storyId);
}

export function validateGeneratedPreview(story: PreviewStory) {
  return story;
}
