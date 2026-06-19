import {
  defaultSchedule,
  getCurrentKoreaTime,
  normalizeSchedule,
  pickCurrentScheduleSlot,
} from "./schedule";

describe("XCAN schedule routing", () => {
  it("keeps the latest start time active until the next slot", () => {
    expect(pickCurrentScheduleSlot(defaultSchedule, "09:59")?.targetPath).toBe("/l");
    expect(pickCurrentScheduleSlot(defaultSchedule, "10:00")?.targetPath).toBe("/b");
    expect(pickCurrentScheduleSlot(defaultSchedule, "20:30")?.targetPath).toBe("/e");
    expect(pickCurrentScheduleSlot(defaultSchedule, "23:30")?.targetPath).toBe("/c");
  });

  it("wraps the last slot through midnight until the first start time", () => {
    expect(pickCurrentScheduleSlot(defaultSchedule, "00:10")?.targetPath).toBe("/c");
    expect(pickCurrentScheduleSlot(defaultSchedule, "07:59")?.targetPath).toBe("/c");
    expect(pickCurrentScheduleSlot(defaultSchedule, "08:00")?.targetPath).toBe("/l");
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
