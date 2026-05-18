"use client";

import { useEffect } from "react";
import type { AnalyticsEventName } from "@/lib/story/schema";

type EventTrackerProps = {
  eventName: AnalyticsEventName;
  storyId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function trackEvent({
  eventName,
  storyId = null,
  metadata = {}
}: EventTrackerProps) {
  try {
    await fetch("/api/events/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ eventName, storyId, metadata }),
      keepalive: true
    });
  } catch {
    // Analytics should never block the story flow.
  }
}

export function EventTracker({ eventName, storyId = null, metadata = {} }: EventTrackerProps) {
  useEffect(() => {
    void trackEvent({ eventName, storyId, metadata });
  }, [eventName, metadata, storyId]);

  return null;
}
