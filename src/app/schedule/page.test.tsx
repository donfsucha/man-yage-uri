import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ScheduleSettingsPage from "./page";
import { scheduleStorageKey } from "@/lib/xcan/schedule";

beforeEach(() => {
  window.localStorage.clear();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const ready = async () => waitFor(() => expect(screen.getByRole("button", { name: "저장" }).hasAttribute("disabled")).toBe(false));

describe("schedule editing", () => {
  it("hydrates a saved custom schedule without replacing mismatched server HTML", async () => {
    localStorage.setItem(scheduleStorageKey, JSON.stringify([{ startTime: "00:01", contentKey: "korean_bible_reading", targetPath: "/c", label: "CCM" }]));
    const container = document.createElement("div");
    container.innerHTML = renderToString(<ScheduleSettingsPage />);
    document.body.append(container);
    const recoverableErrors: unknown[] = [];
    const root = hydrateRoot(container, <ScheduleSettingsPage />, { onRecoverableError: (error) => recoverableErrors.push(error) });
    await ready();
    expect(screen.getByRole("button", { name: "오전 12:01" })).toBeTruthy();
    expect((screen.getByLabelText("콘텐츠") as HTMLSelectElement).value).toBe("korean_bible_reading");
    expect(recoverableErrors).toEqual([]);
    await act(() => root.unmount());
    container.remove();
  });

  it("reports failed storage writes and keeps the edited selection", async () => {
    render(<ScheduleSettingsPage />);
    await ready();
    fireEvent.change(screen.getAllByLabelText("콘텐츠")[0], { target: { value: "korean_bible_reading" } });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Blocked", "QuotaExceededError"); });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByRole("alert").textContent).toContain("저장하지 못했습니다");
    expect((screen.getAllByLabelText("콘텐츠")[0] as HTMLSelectElement).value).toBe("korean_bible_reading");
  });

  it("saves current edits before the run link navigates", async () => {
    render(<ScheduleSettingsPage />);
    await ready();
    fireEvent.change(screen.getAllByLabelText("콘텐츠")[0], { target: { value: "korean_bible_reading" } });
    const preventNavigation = (event: Event) => event.preventDefault();
    document.addEventListener("click", preventNavigation);
    try { fireEvent.click(screen.getByRole("link", { name: "지금 실행" })); }
    finally { document.removeEventListener("click", preventNavigation); }
    expect(JSON.parse(localStorage.getItem(scheduleStorageKey)!)[0].targetPath).toBe("/b");
    expect(screen.getByRole("status").textContent).toContain("저장되었습니다");
  });

  it("cancels run navigation when saving fails", async () => {
    render(<ScheduleSettingsPage />);
    await ready();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
    expect(fireEvent.click(screen.getByRole("link", { name: "지금 실행" }))).toBe(false);
    expect(screen.getByRole("alert").textContent).toContain("저장하지 못했습니다");
  });

  it("scrolls the opened time controls into view", async () => {
    render(<ScheduleSettingsPage />);
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "오전 08:00" }));
    const calls = vi.mocked(HTMLElement.prototype.scrollIntoView).mock;
    expect((calls.instances[0] as HTMLElement).querySelectorAll("select")).toHaveLength(3);
    fireEvent.change(screen.getByLabelText("분", { exact: true }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(JSON.parse(localStorage.getItem(scheduleStorageKey)!)[0].startTime).toBe("08:01");
  });
});

describe("inline reading plan", () => {
  it("opens inline without saving or losing schedule edits and preserves reading checks", async () => {
    render(<ScheduleSettingsPage />);
    await ready();
    fireEvent.change(screen.getAllByLabelText("콘텐츠")[0], { target: { value: "korean_bible_reading" } });
    const toggle = screen.getByRole("button", { name: "성경 읽기표 펼치기" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const panel = document.getElementById("schedule-reading-plan")!;
    expect(panel.hidden).toBe(false);
    expect(panel.className).not.toMatch(/fixed|absolute/);
    fireEvent.click(screen.getByRole("button", { name: "창세기 1장 직접 읽음" }));
    fireEvent.click(screen.getByRole("button", { name: "성경 읽기표 접기" }));
    expect(panel.hidden).toBe(true);
    expect(localStorage.getItem(scheduleStorageKey)).toBeNull();
    expect((screen.getAllByLabelText("콘텐츠")[0] as HTMLSelectElement).value).toBe("korean_bible_reading");
    fireEvent.click(screen.getByRole("button", { name: "성경 읽기표 펼치기" }));
    expect(screen.getByRole("button", { name: "창세기 1장 직접 읽음" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(JSON.parse(localStorage.getItem(scheduleStorageKey)!)[0].contentKey).toBe("korean_bible_reading");
  });
});
