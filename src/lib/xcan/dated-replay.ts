export const playbackRevalidationSeconds = 60;
export const maximumReplayDays = 14;

// Both inputs are verified YYYY-MM-DD calendar dates, independent of viewer timezone.
export function isRecentReplay(date: string, today: string): boolean {
  const days = (Date.parse(today) - Date.parse(date)) / 86400000;
  return days >= 0 && days <= maximumReplayDays;
}

export function needsReplayLabel(checkedAt: number, now: number): boolean {
  return now - checkedAt >= playbackRevalidationSeconds * 1000;
}
