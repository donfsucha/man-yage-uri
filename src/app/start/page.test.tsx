import { afterEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { defaultSchedule, pickCurrentScheduleSlot, scheduleStorageKey } from "@/lib/xcan/schedule";
import NfcStartPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }),
}));
afterEach(() => { vi.clearAllMocks(); vi.restoreAllMocks(); localStorage.clear(); });

describe("web start without changing app schedules", () => {
  it.each(["/l", "/e", "/c", "/custom"])("redirects to /b while preserving the saved %s schedule", (targetPath) => {
    const saved = JSON.stringify([{ startTime: "00:00", contentKey: "custom", targetPath }]);
    localStorage.setItem(scheduleStorageKey, saved);
    expect(() => NfcStartPage()).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/b");
    expect(localStorage.getItem(scheduleStorageKey)).toBe(saved);
  });
  it("does not access browser storage or user agent, so Android web visits cannot relaunch the app", () => {
    const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    const agent = vi.spyOn(window.navigator, "userAgent", "get").mockImplementation(() => { throw new Error("server has no navigator"); });
    expect(() => NfcStartPage()).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/b");
    expect(read).not.toHaveBeenCalled();
    expect(agent).not.toHaveBeenCalled();
  });
  it("preserves every existing default schedule boundary", () => {
    expect(["00:00", "07:59", "08:00", "09:59", "10:00", "19:59", "20:00", "20:59", "21:00", "23:59"].map(time => pickCurrentScheduleSlot(defaultSchedule, time).targetPath))
      .toEqual(["/c", "/c", "/l", "/l", "/b", "/b", "/e", "/e", "/c", "/c"]);
  });
});
