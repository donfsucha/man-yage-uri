import type {
  ChoiceId,
  PreviewStory,
  StoryChapter,
  StoredPreviewStory,
  StoryInput
} from "./schema";
import { generateMockPaidChapters } from "./mock-generator";

const globalStore = globalThis as typeof globalThis & {
  __manYageUriStories?: Map<string, StoredPreviewStory>;
};

function getStore() {
  if (!globalStore.__manYageUriStories) {
    globalStore.__manYageUriStories = new Map<string, StoredPreviewStory>();
  }

  return globalStore.__manYageUriStories;
}

export function savePreviewStory(input: StoryInput, story: PreviewStory) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const stored: StoredPreviewStory = {
    id,
    input,
    story,
    status: "preview_ready",
    selectedChoiceId: null,
    payment: null,
    createdAt: now,
    updatedAt: now
  };

  getStore().set(id, stored);
  return stored;
}

export function getPreviewStory(id: string) {
  return getStore().get(id) ?? null;
}

export function selectStoryChoice(storyId: string, choiceId: string) {
  const story = getPreviewStory(storyId);

  if (!story) {
    return null;
  }

  if (story.status === "completed" || story.payment?.status === "paid") {
    return story;
  }

  const choiceExists = story.story.next_choices.some(
    (choice) => choice.choice_id === choiceId
  );

  if (!choiceExists) {
    return null;
  }

  const updated: StoredPreviewStory = {
    ...story,
    status: "choice_selected",
    selectedChoiceId: choiceId as ChoiceId,
    updatedAt: new Date().toISOString()
  };

  getStore().set(storyId, updated);
  return updated;
}

export function listStories() {
  return [...getStore().values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function createMockPayment(storyId: string, amount = 7900) {
  const story = getPreviewStory(storyId);

  if (!story || !story.selectedChoiceId) {
    return null;
  }

  if (
    (story.status === "payment_pending" && story.payment?.status === "pending") ||
    (story.status === "completed" && story.payment?.status === "paid")
  ) {
    return story;
  }

  if (story.status !== "choice_selected") {
    return null;
  }

  const now = new Date().toISOString();
  const updated: StoredPreviewStory = {
    ...story,
    status: "payment_pending",
    payment: {
      productType: "five_episode_complete",
      amount,
      orderId: `order_${storyId}`,
      status: "pending",
      createdAt: now,
      updatedAt: now
    },
    updatedAt: now
  };

  getStore().set(storyId, updated);
  return updated;
}

export function completeMockPayment(storyId: string) {
  const story = getPreviewStory(storyId);

  if (!story || !story.selectedChoiceId) {
    return null;
  }

  if (story.status === "completed" && story.payment?.status === "paid") {
    return story;
  }

  const payment = story.payment;
  const paymentReady =
    story.status === "payment_pending" && payment?.status === "pending";

  if (!paymentReady) {
    return null;
  }

  const selectedChoice = story.story.next_choices.find(
    (choice) => choice.choice_id === story.selectedChoiceId
  );

  if (!selectedChoice) {
    return null;
  }

  const paidChapters = generateMockPaidChapters(story.input, selectedChoice);
  const chaptersByNo = new Map<number, StoryChapter>();

  for (const chapter of [...story.story.chapters, ...paidChapters]) {
    chaptersByNo.set(chapter.chapter_no, chapter);
  }

  const now = new Date().toISOString();
  const updated: StoredPreviewStory = {
    ...story,
    story: {
      ...story.story,
      chapters: [...chaptersByNo.values()].sort(
        (a, b) => a.chapter_no - b.chapter_no
      )
    },
    status: "completed",
    payment: {
      ...payment,
      status: "paid",
      updatedAt: now
    },
    updatedAt: now
  };

  getStore().set(storyId, updated);
  return updated;
}

export function deleteStory(storyId: string) {
  return getStore().delete(storyId);
}
