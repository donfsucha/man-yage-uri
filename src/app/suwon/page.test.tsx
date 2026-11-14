import { describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import SuwonEntryPage from "./page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("SuwonEntryPage", () => {
  it("keeps the registered URL and opens the app's recognized video route", () => {
    SuwonEntryPage();
    expect(redirect).toHaveBeenCalledWith("/l/suwon");
  });
});
