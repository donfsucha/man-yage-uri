import { describe, expect, it } from "vitest";
import { getAdminDashboardMetrics } from "./metrics";
import type { StoryEvent, StoredPreviewStory } from "@/lib/story/schema";

function makeStory(
  overrides: Partial<StoredPreviewStory> = {}
): StoredPreviewStory {
  const now = "2026-06-05T02:00:00.000Z";

  return {
    id: crypto.randomUUID(),
    input: {
      breakupMoment: "rainy bus stop",
      breakupReason: "misunderstanding",
      alternativeChoice: "I wanted to say I was sorry first.",
      lastScenePlace: "bus stop",
      rememberedDetail: "cold coffee",
      partnerBehavior: "long silence",
      emotion: "regret",
      desiredEnding: "growth",
      protagonistAlias: "A",
      partnerAlias: "B",
      agreedToFictionNotice: true,
      agreedToPrivacyNotice: true
    },
    story: {
      title: "Rainy Day",
      genre: "romance",
      emotional_tone: "quiet",
      summary: "A story about one last message after a breakup.",
      chapters: [
        {
          chapter_no: 1,
          chapter_title: "Chapter 1",
          body: "A".repeat(2000),
          ending_hook: "The message turned read.",
          next_choices: [
            { choice_id: "A", label: "Wait for the reply" },
            { choice_id: "B", label: "Send one more sentence" },
            { choice_id: "C", label: "Turn the phone over" }
          ]
        }
      ],
      scenes: [
        {
          scene_no: 1,
          scene_title: "Phone",
          setting: "Room",
          body: "The phone glowed.",
          dialogue: "Are you typing?",
          visual_prompt: "A cinematic phone screen in a quiet room",
          emotion: "regret"
        }
      ],
      next_choices: [
        { choice_id: "A", label: "Wait for the reply" },
        { choice_id: "B", label: "Send one more sentence" },
        { choice_id: "C", label: "Turn the phone over" }
      ],
      safety_flags: {
        contains_self_harm_risk: false,
        contains_stalking_risk: false,
        requires_manual_review: false
      }
    },
    status: "preview_ready",
    selectedChoiceId: null,
    payment: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function makeEvent(eventName: StoryEvent["eventName"]): StoryEvent {
  return {
    id: crypto.randomUUID(),
    eventName,
    storyId: null,
    metadata: {},
    createdAt: "2026-06-05T02:30:00.000Z"
  };
}

describe("getAdminDashboardMetrics", () => {
  it("summarizes revenue, funnel, quality, and recent operational data", () => {
    const paidStory = makeStory({
      payment: {
        amount: 7900,
        createdAt: "2026-06-05T02:10:00.000Z",
        orderId: "order-1",
        productType: "five_episode_complete",
        status: "paid",
        updatedAt: "2026-06-05T02:20:00.000Z"
      },
      selectedChoiceId: "A",
      status: "completed"
    });
    const previewStory = makeStory();
    const events: StoryEvent[] = [
      makeEvent("story_start"),
      makeEvent("story_start"),
      makeEvent("preview_generated"),
      makeEvent("preview_generated"),
      makeEvent("choice_selected"),
      makeEvent("checkout_view"),
      makeEvent("checkout_click"),
      makeEvent("payment_success"),
      makeEvent("bonus_download")
    ];

    const metrics = getAdminDashboardMetrics(
      [paidStory, previewStory],
      events,
      new Date("2026-06-05T03:00:00.000Z")
    );

    expect(metrics.today.stories).toBe(2);
    expect(metrics.totals.paidStories).toBe(1);
    expect(metrics.totals.bonusDownloads).toBe(1);
    expect(metrics.revenue.productRevenueEstimateKrw).toBe(7900);
    expect(metrics.revenue.estimatedAiCostKrw).toBe(170);
    expect(metrics.funnel.at(-1)).toMatchObject({
      count: 1,
      label: "결제 성공",
      rateFromPrevious: 100
    });
    expect(metrics.recentPayments).toHaveLength(1);
    expect(metrics.eventBreakdown.payment_success).toBe(1);
  });
});
