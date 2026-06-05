import { getRuntimeConfig } from "@/lib/config/runtime";
import type { StoryEvent, StoredPreviewStory } from "@/lib/story/schema";
import {
  LONG_FORM_TARGETS,
  getStoryLengthStats
} from "@/lib/story/story-length";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const PREVIEW_COST_KRW = 20;
const COMPLETE_STORY_COST_KRW = 150;
const PRODUCT_PRICE_KRW = 7900;

export type FunnelMetric = {
  label: string;
  count: number;
  rateFromPrevious: number | null;
};

export type AdminDashboardMetrics = ReturnType<typeof getAdminDashboardMetrics>;

function toKstDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function isSameKstDay(value: string, now: Date) {
  return toKstDateKey(value) === toKstDateKey(now);
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return null;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

function countEvents(events: StoryEvent[], eventName: StoryEvent["eventName"]) {
  return events.filter((event) => event.eventName === eventName).length;
}

function getPaidStories(stories: StoredPreviewStory[]) {
  return stories.filter(
    (story) => story.status === "completed" || story.payment?.status === "paid"
  );
}

function getStoredPaidAmountTotal(stories: StoredPreviewStory[]) {
  return getPaidStories(stories).reduce(
    (total, story) => total + (story.payment?.amount ?? 0),
    0
  );
}

function getQualityFlags(stories: StoredPreviewStory[]) {
  const completedStories = stories.filter((story) => story.status === "completed");

  return {
    generationFailed: stories.filter((story) => story.status === "generation_failed")
      .length,
    manualReview: stories.filter(
      (story) => story.story.safety_flags.requires_manual_review
    ).length,
    tooShortCompleted: completedStories.filter(
      (story) =>
        getStoryLengthStats(story.story).estimatedPages <
        LONG_FORM_TARGETS.fullStory.minPages
    ).length,
    tooLongCompleted: completedStories.filter(
      (story) =>
        getStoryLengthStats(story.story).estimatedPages >
        LONG_FORM_TARGETS.fullStory.maxPages
    ).length
  };
}

function getEventBreakdown(events: StoryEvent[]) {
  return events.reduce<Record<string, number>>((breakdown, event) => {
    breakdown[event.eventName] = (breakdown[event.eventName] ?? 0) + 1;
    return breakdown;
  }, {});
}

export function getAdminDashboardMetrics(
  stories: StoredPreviewStory[],
  events: StoryEvent[],
  now = new Date()
) {
  const todayStories = stories.filter((story) => isSameKstDay(story.createdAt, now));
  const todayEvents = events.filter((event) => isSameKstDay(event.createdAt, now));
  const paidStories = getPaidStories(stories);
  const todayPaidStories = getPaidStories(todayStories);
  const checkoutViews =
    countEvents(events, "checkout_view") ||
    stories.filter((story) => story.status === "payment_pending").length;
  const checkoutClicks = countEvents(events, "checkout_click");
  const paymentSuccesses =
    countEvents(events, "payment_success") || paidStories.length;
  const storyStarts = countEvents(events, "story_start") || stories.length;
  const previews = countEvents(events, "preview_generated") || stories.length;
  const choices =
    countEvents(events, "choice_selected") ||
    stories.filter((story) => Boolean(story.selectedChoiceId)).length;
  const bonusDownloads = countEvents(events, "bonus_download");
  const paymentFailures = countEvents(events, "payment_failed");
  const productRevenueEstimateKrw = paidStories.length * PRODUCT_PRICE_KRW;
  const todayRevenueEstimateKrw = todayPaidStories.length * PRODUCT_PRICE_KRW;
  const storedPaidAmountTotal = getStoredPaidAmountTotal(stories);
  const estimatedAiCostKrw =
    Math.max(previews, stories.length) * PREVIEW_COST_KRW +
    paidStories.length * (COMPLETE_STORY_COST_KRW - PREVIEW_COST_KRW);
  const estimatedMarginKrw = productRevenueEstimateKrw - estimatedAiCostKrw;
  const config = getRuntimeConfig();
  const funnel: FunnelMetric[] = [
    { label: "1화 생성 시작", count: storyStarts, rateFromPrevious: null },
    {
      label: "1화 생성 완료",
      count: previews,
      rateFromPrevious: percent(previews, storyStarts)
    },
    {
      label: "선택지 선택",
      count: choices,
      rateFromPrevious: percent(choices, previews)
    },
    {
      label: "결제 페이지 진입",
      count: checkoutViews,
      rateFromPrevious: percent(checkoutViews, choices)
    },
    {
      label: "결제 버튼 클릭",
      count: checkoutClicks,
      rateFromPrevious: percent(checkoutClicks, checkoutViews)
    },
    {
      label: "결제 성공",
      count: paymentSuccesses,
      rateFromPrevious: percent(paymentSuccesses, checkoutClicks)
    }
  ];

  return {
    generatedAt: now.toISOString(),
    today: {
      stories: todayStories.length,
      events: todayEvents.length,
      paidStories: todayPaidStories.length,
      revenueEstimateKrw: todayRevenueEstimateKrw
    },
    totals: {
      stories: stories.length,
      previewReady: stories.filter((story) => story.status === "preview_ready")
        .length,
      choiceSelected: stories.filter((story) => story.status === "choice_selected")
        .length,
      paymentPending: stories.filter((story) => story.status === "payment_pending")
        .length,
      completed: stories.filter((story) => story.status === "completed").length,
      paidStories: paidStories.length,
      checkoutClicks,
      checkoutViews,
      paymentSuccesses,
      paymentFailures,
      bonusDownloads
    },
    revenue: {
      productPriceKrw: PRODUCT_PRICE_KRW,
      productRevenueEstimateKrw,
      todayRevenueEstimateKrw,
      storedPaidAmountTotal,
      configuredCurrency: config.paypalCurrency,
      configuredAmount: config.paypalAmount,
      estimatedAiCostKrw,
      estimatedMarginKrw
    },
    funnel,
    quality: getQualityFlags(stories),
    eventBreakdown: getEventBreakdown(events),
    recentStories: stories.slice(0, 20),
    recentEvents: events.slice(0, 30),
    recentPayments: stories
      .filter((story) => story.payment)
      .sort((a, b) =>
        (b.payment?.updatedAt ?? b.updatedAt).localeCompare(
          a.payment?.updatedAt ?? a.updatedAt
        )
      )
      .slice(0, 20)
  };
}

export function formatKrw(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    currency: "KRW",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(amount);
}

export function formatPercent(value: number | null) {
  return value === null ? "-" : `${value.toFixed(1)}%`;
}
