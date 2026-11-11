import { describe, expect, it, vi } from "vitest";
import {
  defaultSchedule,
  getCurrentKoreaTime,
  normalizeSchedule,
  pickCurrentScheduleSlot,
  rememberOpenedSlot,
} from "./schedule";

describe("XCAN schedule routing", () => {
  it("repairs a saved destination and label that contradict a known content key", () => {
    const slots = normalizeSchedule([{ startTime: "00:01", contentKey: "korean_bible_reading", targetPath: "/c", label: "CCM" }]);
    expect(slots[0]).toEqual({ startTime: "00:01", contentKey: "korean_bible_reading", targetPath: "/b", label: "한글성경통독" });
    expect(pickCurrentScheduleSlot(slots, "12:00").targetPath).toBe("/b");
  });

  it("allows navigation to continue when recording playback history fails", () => {
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Blocked", "QuotaExceededError"); });
    try {
      expect(rememberOpenedSlot(defaultSchedule[0])).toBe(false);
    } finally {
      write.mockRestore();
    }
  });
  it("keeps the latest start time active until the next slot", () => {
    expect(pickCurrentScheduleSlot(defaultSchedule, "09:59")?.targetPath).toBe("/b");
    expect(pickCurrentScheduleSlot(defaultSchedule, "10:00")?.targetPath).toBe("/b");
    expect(pickCurrentScheduleSlot(defaultSchedule, "20:30")?.targetPath).toBe("/b");
    expect(pickCurrentScheduleSlot(defaultSchedule, "23:30")?.targetPath).toBe("/b");
  });

  it("wraps the last slot through midnight until the first start time", () => {
    expect(pickCurrentScheduleSlot(defaultSchedule, "00:10")?.targetPath).toBe("/b");
    expect(pickCurrentScheduleSlot(defaultSchedule, "07:59")?.targetPath).toBe("/b");
    expect(pickCurrentScheduleSlot(defaultSchedule, "08:00")?.targetPath).toBe("/b");
  });

  it("falls back to the default schedule when saved data is unusable", () => {
    expect(normalizeSchedule({ broken: true })).toEqual(defaultSchedule);
    expect(normalizeSchedule([{ startTime: "bad", targetPath: "/x" }])).toEqual(
      defaultSchedule,
    );
  });

  it("accepts valid custom local schedules", () => {
    const schedule = normalizeSchedule([
      {
        startTime: "06:00",
        contentKey: "custom_youtube",
        targetPath: "/custom",
        label: "Custom",
      },
    ]);

    expect(schedule).toHaveLength(1);
    expect(pickCurrentScheduleSlot(schedule, "18:00")?.targetPath).toBe("/custom");
  });

  it("formats the current time in Asia/Seoul", () => {
    const utcMidnight = new Date("2026-06-19T00:15:00.000Z");

    expect(getCurrentKoreaTime(utcMidnight)).toBe("09:15");
  });
});

describe("Korean Bible default schedule", () => {
  it("routes every minute of the day to the Korean Bible", () => {
    for (let minute = 0; minute < 1440; minute++) {
      const time = String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0");
      expect(pickCurrentScheduleSlot(defaultSchedule, time).contentKey).toBe("korean_bible_reading");
      expect(pickCurrentScheduleSlot(defaultSchedule, time).targetPath).toBe("/b");
    }
  });
});
