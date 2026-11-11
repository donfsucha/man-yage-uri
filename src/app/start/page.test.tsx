import { afterEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import NfcStartPage from "./page";

vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }) }));
afterEach(() => { vi.clearAllMocks(); localStorage.clear(); });

describe("NFC start route", () => {
  it.each(["/l", "/e", "/c", "/custom"])("ignores saved %s and redirects directly to /b", (targetPath) => {
    localStorage.setItem("xcan:user-schedule", JSON.stringify([{ startTime: "00:00", contentKey: "custom", targetPath }]));
    expect(() => NfcStartPage()).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/b");
  });
  it("does not depend on available browser storage", () => {
    const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    try {
      expect(() => NfcStartPage()).toThrow("NEXT_REDIRECT");
      expect(read).not.toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledExactlyOnceWith("/b");
    } finally { read.mockRestore(); }
  });
});
