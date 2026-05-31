import { describe, expect, it } from "vitest";
import { generateMockPreview } from "./mock-generator";
import {
  completeMockPayment,
  createMockPayment,
  deleteStory,
  getPreviewStory,
  listStories,
  listStoryEvents,
  recordStoryEvent,
  savePreviewStory,
  selectStoryChoice
} from "./store";
import type { StoryInput } from "./schema";

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

describe("story store", () => {
  it("saves preview stories with preview_ready status", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));

    expect(stored.status).toBe("preview_ready");
    expect(stored.selectedChoiceId).toBeNull();
    expect(stored.story.scenes.length).toBeGreaterThanOrEqual(3);
  });

  it("selects a valid next choice and moves the story to choice_selected", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));
    const updated = selectStoryChoice(stored.id, "B");

    expect(updated?.status).toBe("choice_selected");
    expect(updated?.selectedChoiceId).toBe("B");
    expect(getPreviewStory(stored.id)?.selectedChoiceId).toBe("B");
  });

  it("rejects invalid next choice IDs", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));

    expect(selectStoryChoice(stored.id, "Z")).toBeNull();
    expect(getPreviewStory(stored.id)?.status).toBe("preview_ready");
  });

  it("creates a mock payment only after a choice is selected", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));

    expect(createMockPayment(stored.id)).toBeNull();

    selectStoryChoice(stored.id, "A");
    const paidReady = createMockPayment(stored.id);

    expect(paidReady?.status).toBe("payment_pending");
    expect(paidReady?.payment?.amount).toBe(7900);
    expect(paidReady?.payment?.status).toBe("pending");
  });

  it("stores a custom direction label when selecting the custom choice slot", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));
    const updated = selectStoryChoice(
      stored.id,
      "C",
      "서로의 오해를 확인하고 각자의 성장을 선택한다"
    );

    expect(updated?.selectedChoiceId).toBe("C");
    expect(
      updated?.story.next_choices.find((choice) => choice.choice_id === "C")?.label
    ).toBe("서로의 오해를 확인하고 각자의 성장을 선택한다");
    expect(
      updated?.story.chapters[0].next_choices?.find((choice) => choice.choice_id === "C")
        ?.label
    ).toBe("서로의 오해를 확인하고 각자의 성장을 선택한다");
  });

  it("completes a mock payment and appends paid chapters", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));
    selectStoryChoice(stored.id, "A");
    createMockPayment(stored.id);

    const completed = completeMockPayment(stored.id);

    expect(completed?.status).toBe("completed");
    expect(completed?.payment?.status).toBe("paid");
    expect(completed?.story.chapters.map((chapter) => chapter.chapter_no)).toEqual([
      1, 2, 3, 4, 5
    ]);
  });

  it("does not downgrade a completed story when a choice is selected again", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));
    selectStoryChoice(stored.id, "A");
    createMockPayment(stored.id);
    completeMockPayment(stored.id);

    const updated = selectStoryChoice(stored.id, "B");

    expect(updated?.status).toBe("completed");
    expect(updated?.selectedChoiceId).toBe("A");
  });

  it("returns the completed story when payment completion is retried", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));
    selectStoryChoice(stored.id, "A");
    createMockPayment(stored.id);
    const completed = completeMockPayment(stored.id);

    expect(completeMockPayment(stored.id)).toEqual(completed);
  });

  it("lists and deletes stories", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));

    expect(listStories().some((story) => story.id === stored.id)).toBe(true);
    expect(deleteStory(stored.id)).toBe(true);
    expect(getPreviewStory(stored.id)).toBeNull();
  });

  it("records checkout click events for conversion validation", () => {
    const stored = savePreviewStory(input, generateMockPreview(input));
    const event = recordStoryEvent({
      eventName: "checkout_click",
      storyId: stored.id,
      metadata: { source: "checkout_page" }
    });

    expect(event.eventName).toBe("checkout_click");
    expect(event.storyId).toBe(stored.id);
    expect(event.metadata).toEqual({ source: "checkout_page" });
    expect(listStoryEvents(stored.id)).toContainEqual(event);
  });
});
